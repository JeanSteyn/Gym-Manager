import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Base Supabase client (for auth verification only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Auth middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Create a Supabase client with the user's token for RLS
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ============ WORKOUTS ROUTES ============

// Get all workouts with exercise count
app.get('/api/workouts', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('workouts')
      .select(`
        *,
        exercises:exercises(count)
      `)
      .eq('user_id', req.user.id)
      .order('workout_date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Transform the data to include exercise count
    const workouts = data.map(w => ({
      ...w,
      exercise_count: w.exercises[0]?.count || 0
    }));
    
    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single workout with all exercises
app.get('/api/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await req.supabase
      .from('workouts')
      .select(`
        *,
        exercises (*)
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Workout not found' });
    
    res.json({ workout: data });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new workout
app.post('/api/workouts', authenticateUser, async (req, res) => {
  try {
    const { name, workout_date, notes } = req.body;

    if (!name || !workout_date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    const { data, error } = await req.supabase
      .from('workouts')
      .insert([{
        user_id: req.user.id,
        name,
        workout_date,
        notes: notes || null
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ workout: data });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update workout
app.patch('/api/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, workout_date, notes } = req.body;

    const { data, error } = await req.supabase
      .from('workouts')
      .update({
        name,
        workout_date,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ workout: data });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete workout (will cascade delete exercises)
app.delete('/api/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ EXERCISES ROUTES ============

// Get exercises for a workout
app.get('/api/workouts/:workoutId/exercises', authenticateUser, async (req, res) => {
  try {
    const { workoutId } = req.params;

    const { data, error } = await req.supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ exercises: data });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add exercise to workout
app.post('/api/workouts/:workoutId/exercises', authenticateUser, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { exercise_name, sets, reps, weight } = req.body;

    if (!exercise_name || !sets || !reps || weight === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify workout belongs to user
    const { data: workout } = await req.supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('user_id', req.user.id)
      .single();

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const { data, error } = await req.supabase
      .from('exercises')
      .insert([{
        workout_id: workoutId,
        user_id: req.user.id,
        exercise_name,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight)
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ exercise: data });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update exercise
app.patch('/api/exercises/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { exercise_name, sets, reps, weight } = req.body;

    const { data, error } = await req.supabase
      .from('exercises')
      .update({
        exercise_name,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ exercise: data });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete exercise
app.delete('/api/exercises/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});