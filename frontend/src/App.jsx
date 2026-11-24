
import { useEffect, useState } from 'react'
import { apiRequest, prepareCsrf } from './api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [registering, setRegistering] = useState(false)
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  async function loadTasks() {
    const data = await apiRequest('/api/tasks/')
    setTasks(data)
  }

  useEffect(() => {
    async function initialize() {
      try {
        await prepareCsrf()

        const currentUser = await apiRequest(
          '/api/accounts/me/'
        )

        setUser(currentUser)
        const data = await apiRequest('/api/tasks/')
        setTasks(data)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function handleAuthentication(event) {
    event.preventDefault()

    try {
      setError('')

      const endpoint = registering
        ? '/api/accounts/register/'
        : '/api/accounts/login/'

      const data = await apiRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      setUser(data)
      setPassword('')
      await prepareCsrf()
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleLogout() {
    try {
      setError('')

      await apiRequest('/api/accounts/logout/', {
        method: 'POST',
      })

      setUser(null)
      setTasks([])
      setTitle('')
      setDescription('')
      cancelEditing()
      await prepareCsrf()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addTask(event) {
    event.preventDefault()

    if (!title.trim()) return

    try {
      setError('')

      await apiRequest('/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false,
        }),
      })

      setTitle('')
      setDescription('')
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEditing(task) {
    setError('')
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  async function saveTask(event, id) {
    event.preventDefault()

    if (!editTitle.trim()) {
      setError('Task title is required.')
      return
    }

    try {
      setError('')

      await apiRequest(`/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      })

      cancelEditing()
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleTask(task) {
    try {
      setError('')

      await apiRequest(`/api/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      })

      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteTask(id) {
    if (!window.confirm('Delete this task?')) return

    try {
      setError('')

      await apiRequest(`/api/tasks/${id}/`, {
        method: 'DELETE',
      })

      if (editingId === id) {
        cancelEditing()
      }

      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length

  if (loading) {
    return <p className="container main">Loading TaskFlow...</p>
  }

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>TaskFlow</h1>
            <p className="subtitle">
              Organize your tasks. Focus on what matters.
            </p>
          </div>
        </header>

        <main className="container main">
          <section className="panel">
            <h2>
              {registering ? 'Create an account' : 'Log in'}
            </h2>

            <form onSubmit={handleAuthentication}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              <button className="primary-button" type="submit">
                {registering ? 'Register' : 'Log in'}
              </button>
            </form>

            <p>
              <button
                type="button"
                onClick={() => setRegistering(!registering)}
              >
                {registering
                  ? 'Already have an account? Log in'
                  : 'Need an account? Register'}
              </button>
            </p>

            {error && <p className="error">{error}</p>}
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <p className="eyebrow">
            WELCOME, {user.username}
          </p>

          <h1>TaskFlow</h1>

          <p className="subtitle">
            Organize your tasks. Focus on what matters.
          </p>

          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="container main">
        <section className="summary">
          <div>
            <span className="summary-number">
              {tasks.length}
            </span>
            <span className="summary-label">Total tasks</span>
          </div>

          <div>
            <span className="summary-number">
              {completedCount}
            </span>
            <span className="summary-label">Completed</span>
          </div>

          <div>
            <span className="summary-number">
              {tasks.length - completedCount}
            </span>
            <span className="summary-label">Remaining</span>
          </div>
        </section>

        <section className="panel">
          <h2>Add a new task</h2>

          <form onSubmit={addTask}>
            <label htmlFor="task-title">Task title</label>

            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="What do you need to do?"
              required
            />

            <label htmlFor="description">
              Description (optional)
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={3}
            />

            <button className="primary-button" type="submit">
              Add Task
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Your tasks</h2>

          {error && <p className="error">{error}</p>}

          {tasks.length === 0 ? (
            <p className="empty">
              No tasks yet. Add your first task above!
            </p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task ${
                    task.completed ? 'done' : ''
                  }`}
                >
                  {editingId === task.id ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) =>
                        saveTask(event, task.id)
                      }
                    >
                      <label htmlFor={`edit-title-${task.id}`}>
                        Edit task title
                      </label>

                      <input
                        id={`edit-title-${task.id}`}
                        type="text"
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(event.target.value)
                        }
                        required
                        autoFocus
                      />

                      <label htmlFor={`edit-description-${task.id}`}>
                        Edit description
                      </label>

                      <textarea
                        id={`edit-description-${task.id}`}
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        rows={3}
                      />

                      <div className="task-actions">
                        <button
                          type="submit"
                          className="save-button"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          className="cancel-button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                      />

                      <div className="task-content">
                        <h3>{task.title}</h3>
                        {task.description && (
                          <p>{task.description}</p>
                        )}
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => startEditing(task)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
