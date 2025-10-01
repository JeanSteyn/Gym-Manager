import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import axios from 'axios';
import { Dumbbell, LogOut, Plus, Trash2, Calendar, ChevronRight, ArrowLeft, Edit2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      
      if (isSignUp) {
        alert('Check your email for the confirmation link!');
      } else {
        onAuthSuccess(data.user, data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Dumbbell className="w-12 h-12 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Workout Logger
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

function CreateWorkoutModal({ onClose, onWorkoutCreated, session }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      alert('Please enter a workout name');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/workouts`,
        { name, workout_date: date, notes },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      onWorkoutCreated(response.data.workout);
      onClose();
    } catch (error) {
      alert('Error creating workout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Workout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chest & Triceps"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this workout..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating...' : 'Create Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkoutsList({ workouts, onSelectWorkout, onDeleteWorkout, session }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure? This will delete the workout and all its exercises.')) return;

    setDeleting(id);

    try {
      await axios.delete(`${API_URL}/api/workouts/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      onDeleteWorkout(id);
    } catch (error) {
      alert('Error deleting workout: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (workouts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No workouts yet</h3>
        <p className="text-gray-500">Create your first workout to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          onClick={() => onSelectWorkout(workout)}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer relative group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{workout.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(workout.workout_date).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, workout.id)}
              disabled={deleting === workout.id}
              className="text-red-500 hover:text-red-700 transition opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            {workout.exercise_count} {workout.exercise_count === 1 ? 'exercise' : 'exercises'}
          </div>

          {workout.notes && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{workout.notes}</p>
          )}

          <div className="flex items-center text-indigo-600 text-sm font-medium">
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseForm({ workoutId, onExerciseAdded, session }) {
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!exercise || !sets || !reps || !weight) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/workouts/${workoutId}/exercises`,
        {
          exercise_name: exercise,
          sets: parseInt(sets),
          reps: parseInt(reps),
          weight: parseFloat(weight)
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      onExerciseAdded(response.data.exercise);

      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
    } catch (error) {
      alert('Error adding exercise: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2" />
        Add Exercise
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Name
          </label>
          <input
            type="text"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="Bench Press"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sets
          </label>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            placeholder="3"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reps
          </label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="60"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium mt-4 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Exercise'}
      </button>
    </div>
  );
}

function ExercisesList({ exercises, onDeleteExercise, session }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Delete this exercise?')) return;

    setDeleting(id);

    try {
      await axios.delete(`${API_URL}/api/exercises/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      onDeleteExercise(id);
    } catch (error) {
      alert('Error deleting exercise: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500">No exercises logged yet. Add your first exercise above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exercise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reps
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight (kg)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exercises.map((exercise) => (
              <tr key={exercise.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {exercise.exercise_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {exercise.sets}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {exercise.reps}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {exercise.weight}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDelete(exercise.id)}
                    disabled={deleting === exercise.id}
                    className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkoutDetail({ workout, session, onBack }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/workouts/${workout.id}/exercises`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      setExercises(response.data.exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseAdded = (exercise) => {
    setExercises([...exercises, exercise]);
  };

  const handleDeleteExercise = (id) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Workouts
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{workout.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(workout.workout_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            {workout.notes && (
              <p className="text-gray-600 mt-2">{workout.notes}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{exercises.length}</div>
            <div className="text-sm text-gray-500">
              {exercises.length === 1 ? 'Exercise' : 'Exercises'}
            </div>
          </div>
        </div>
      </div>

      <ExerciseForm
        workoutId={workout.id}
        onExerciseAdded={handleExerciseAdded}
        session={session}
      />

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading exercises...</div>
        </div>
      ) : (
        <ExercisesList
          exercises={exercises}
          onDeleteExercise={handleDeleteExercise}
          session={session}
        />
      )}
    </div>
  );
}

function Dashboard({ user, session, onSignOut }) {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workouts`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      setWorkouts(response.data.workouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutCreated = (workout) => {
    setWorkouts([workout, ...workouts]);
    setSelectedWorkout(workout);
  };

  const handleDeleteWorkout = (id) => {
    setWorkouts(workouts.filter(w => w.id !== id));
    if (selectedWorkout?.id === id) {
      setSelectedWorkout(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Dumbbell className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-800">Workout Logger</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedWorkout ? (
          <WorkoutDetail
            workout={selectedWorkout}
            session={session}
            onBack={() => setSelectedWorkout(null)}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Workouts</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Workout
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading workouts...</div>
              </div>
            ) : (
              <WorkoutsList
                workouts={workouts}
                onSelectWorkout={setSelectedWorkout}
                onDeleteWorkout={handleDeleteWorkout}
                session={session}
              />
            )}
          </>
        )}
      </main>

      {showCreateModal && (
        <CreateWorkoutModal
          onClose={() => setShowCreateModal(false)}
          onWorkoutCreated={handleWorkoutCreated}
          session={session}
        />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = () => {
    setUser(null);
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} session={session} onSignOut={handleSignOut} />
  ) : (
    <Auth onAuthSuccess={(user, session) => {
      setUser(user);
      setSession(session);
    }} />
  );
}