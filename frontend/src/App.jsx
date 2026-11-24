
import { useEffect, useState } from 'react'
import { apiRequest, prepareCsrf } from './api'
import './App.css'

const developerName = 'Igisubizo Cedrick'
const developerEmail = 'igisubizocedric@gmail.com'
const githubUrl = 'https://github.com/Cedrick-Most/taskflow'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <h2>TaskFlow.</h2>
          <p>Less chaos. More clarity.</p>
        </div>

        <div className="footer-links">
          <a href={`mailto:${developerEmail}`}>Contact</a>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>

        <div className="footer-credit">
          <p>Designed and developed by {developerName}</p>
          <p>
            © {new Date().getFullYear()} TaskFlow.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('home')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  function navigate(nextPage) {
    setError('')
    setPassword('')
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

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
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function handleAuthentication(event) {
    event.preventDefault()

    if (authLoading) return

    try {
      setError('')
      setAuthLoading(true)

      const endpoint =
        page === 'register'
          ? '/api/accounts/register/'
          : '/api/accounts/login/'

      const data = await apiRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      setTasks([])
      setUser(data)
      setPassword('')

      await prepareCsrf()
      await loadTasks()

      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch (err) {
      setError(err.message)
    } finally {
      setAuthLoading(false)
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
      setUsername('')
      setPassword('')

      cancelEditing()
      navigate('home')

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

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedCount / tasks.length) * 100
        )

  if (loading) {
    return (
      <div className="loading-screen">
        <h1>TaskFlow.</h1>
        <div className="spinner"></div>
        <p>Preparing your workspace...</p>
      </div>
    )
  }

  // PUBLIC WEBSITE AND AUTHENTICATION

  if (!user) {
    return (
      <div className="app">

        <nav className="navbar">
          <div className="container nav-content">

            <button
              className="brand"
              onClick={() => navigate('home')}
            >
              TaskFlow<span>.</span>
            </button>

            {page === 'home' && (
              <div className="nav-links">
                <a href="#home">Home</a>
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
              </div>
            )}

            <div className="nav-actions">
              <button
                className="outline-button"
                onClick={() => navigate('login')}
              >
                Log in
              </button>

              <button
                className="primary-button"
                onClick={() => navigate('register')}
              >
                Get started
              </button>
            </div>

          </div>
        </nav>

        {page === 'home' ? (
          <main>

            {/* HERO SECTION */}

            <section className="hero" id="home">
              <div className="container hero-content">

                <span className="hero-badge">
                  Simplify your everyday life
                </span>

                <h1>
                  Less chaos.
                  <br />
                  More clarity.
                </h1>

                <p className="hero-description">
                  A simple, powerful workspace to organize
                  your tasks, track your progress and focus
                  on what truly matters.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-button large-button"
                    onClick={() => navigate('register')}
                  >
                    Get started free →
                  </button>

                  <a
                    className="outline-button large-button"
                    href="#features"
                  >
                    Explore features
                  </a>
                </div>

                <p className="hero-note">
                  Free to use. Simple by design.
                </p>

                {/* DASHBOARD DEMONSTRATION */}

                <div className="dashboard-preview">

                  <div className="preview-top">
                    <div className="window-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    <span>TaskFlow Workspace</span>
                    <span className="preview-label">Demo</span>
                  </div>

                  <div className="preview-body">

                    <div className="preview-heading">
                      <div>
                        <h2>My workspace</h2>
                        <p>Make today productive.</p>
                      </div>
                      <span className="preview-avatar">T</span>
                    </div>

                    <div className="preview-stats">
                      <div>
                        <strong>5</strong>
                        <span>Total tasks</span>
                      </div>

                      <div>
                        <strong>3</strong>
                        <span>Completed</span>
                      </div>

                      <div>
                        <strong>2</strong>
                        <span>Remaining</span>
                      </div>
                    </div>

                    <div className="preview-progress">
                      <div>
                        <span>Daily progress</span>
                        <strong>60%</strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                    </div>

                    <div className="preview-task">
                      <span className="demo-check checked">✓</span>
                      <span className="demo-completed">
                        Plan my week
                      </span>
                      <span className="demo-status">Done</span>
                    </div>

                    <div className="preview-task">
                      <span className="demo-check"></span>
                      <span>Complete assignment</span>
                      <span className="demo-status">Pending</span>
                    </div>

                    <div className="preview-task">
                      <span className="demo-check"></span>
                      <span>Learn something new</span>
                      <span className="demo-status">Pending</span>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* FEATURES SECTION */}

            <section className="section" id="features">
              <div className="container">

                <div className="section-heading">
                  <span className="section-label">
                    Features
                  </span>

                  <h2>
                    Everything you need.
                    <br />
                    Nothing you don't.
                  </h2>

                  <p>
                    Powerful essentials designed to make
                    your everyday life easier.
                  </p>
                </div>

                <div className="features-grid">

                  <article className="feature-card">
                    <div className="feature-icon">✓</div>
                    <h3>Stay organized</h3>
                    <p>
                      Create, edit and manage your daily
                      tasks in one simple workspace.
                    </p>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon">↗</div>
                    <h3>Track your progress</h3>
                    <p>
                      See your completed and remaining
                      tasks as you work toward your goals.
                    </p>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon">◎</div>
                    <h3>Your private space</h3>
                    <p>
                      Your personal account keeps your
                      tasks separate from other users.
                    </p>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon">↻</div>
                    <h3>Saved automatically</h3>
                    <p>
                      Your saved tasks remain available
                      when you return to your account.
                    </p>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon">▣</div>
                    <h3>Access anywhere</h3>
                    <p>
                      Open TaskFlow on your computer,
                      tablet or smartphone.
                    </p>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon">✦</div>
                    <h3>Simple by design</h3>
                    <p>
                      A clean, distraction-free interface
                      that puts your productivity first.
                    </p>
                  </article>

                </div>
              </div>
            </section>

            {/* HOW IT WORKS */}

            <section className="section soft-section">
              <div className="container">

                <div className="section-heading">
                  <span className="section-label">
                    How it works
                  </span>

                  <h2>Get started in three simple steps.</h2>
                </div>

                <div className="steps-grid">

                  <article className="step-card">
                    <span className="step-number">01</span>
                    <h3>Create your account</h3>
                    <p>
                      Register for free and get your own
                      personal workspace.
                    </p>
                  </article>

                  <article className="step-card">
                    <span className="step-number">02</span>
                    <h3>Add your tasks</h3>
                    <p>
                      Write down your goals, assignments
                      and daily responsibilities.
                    </p>
                  </article>

                  <article className="step-card">
                    <span className="step-number">03</span>
                    <h3>Make progress</h3>
                    <p>
                      Complete tasks and stay focused
                      on achieving your goals.
                    </p>
                  </article>

                </div>
              </div>
            </section>

            {/* ABOUT SECTION */}

            <section className="section" id="about">
              <div className="container about-grid">

                <div className="about-visual">
                  <span>TF.</span>
                  <p>Built for a more productive life.</p>
                </div>

                <div className="about-content">
                  <span className="section-label">
                    About TaskFlow
                  </span>

                  <h2>
                    Productivity should be simple.
                  </h2>

                  <p>
                    TaskFlow is a web-based task management
                    application designed to help students,
                    professionals and individuals organize
                    their daily responsibilities.
                  </p>

                  <p>
                    Our goal is to provide a simple and
                    accessible digital workspace where you
                    can manage your tasks without unnecessary
                    distractions.
                  </p>

                  <p>
                    TaskFlow is built using React, Django
                    REST Framework and MySQL, combining
                    modern web technologies with a clean
                    and practical user experience.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => navigate('register')}
                  >
                    Try TaskFlow →
                  </button>
                </div>

              </div>
            </section>

            {/* DEVELOPER AND CONTACT SECTION */}

            <section
              className="section soft-section"
              id="contact"
            >
              <div className="container">

                <div className="section-heading">
                  <span className="section-label">
                    Meet the developer
                  </span>
                  <h2>The person behind TaskFlow.</h2>
                </div>

                <div className="developer-card">

                  <div className="developer-avatar">
                    IC
                  </div>

                  <h3>{developerName}</h3>

                  <span className="developer-role">
                    Creator & Developer
                  </span>

                  <p>
                    Building simple digital solutions
                    for everyday challenges through
                    technology and thoughtful design.
                  </p>

                  <a
                    className="contact-email"
                    href={`mailto:${developerEmail}`}
                  >
                    {developerEmail}
                  </a>

                  <div className="developer-actions">

                    <a
                      className="primary-button"
                      href={`mailto:${developerEmail}`}
                    >
                      Contact me
                    </a>

                    <a
                      className="outline-button"
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View GitHub
                    </a>

                  </div>

                </div>
              </div>
            </section>

            {/* CALL TO ACTION */}

            <section className="cta-section">
              <div className="container">

                <h2>Ready to organize your life?</h2>

                <p>
                  Start building better habits,
                  one task at a time.
                </p>

                <button
                  className="light-button"
                  onClick={() => navigate('register')}
                >
                  Create your free account →
                </button>

              </div>
            </section>

          </main>
        ) : (

          /* LOGIN AND REGISTRATION PAGES */

          <main className="auth-page">
            <div className="auth-card">

              <button
                className="back-button"
                onClick={() => navigate('home')}
              >
                ← Back to homepage
              </button>

              <div className="auth-heading">
                <span className="auth-logo">TF.</span>

                <h1>
                  {page === 'register'
                    ? 'Create your account'
                    : 'Welcome back'}
                </h1>

                <p>
                  {page === 'register'
                    ? 'Start your journey to a more organized life.'
                    : 'Log in to your personal workspace.'}
                </p>
              </div>

              <form onSubmit={handleAuthentication}>

                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  placeholder="Enter your username"
                  autoComplete="username"
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  required
                />

                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  autoComplete={
                    page === 'register'
                      ? 'new-password'
                      : 'current-password'
                  }
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="primary-button auth-submit"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? 'Please wait...'
                    : page === 'register'
                    ? 'Create account'
                    : 'Log in'}
                </button>

              </form>

              <div className="auth-switch">

                {page === 'register'
                  ? 'Already have an account?'
                  : "Don't have an account?"}

                <button
                  className="text-button"
                  onClick={() =>
                    navigate(
                      page === 'register'
                        ? 'login'
                        : 'register'
                    )
                  }
                >
                  {page === 'register'
                    ? 'Log in'
                    : 'Register'}
                </button>

              </div>

            </div>
          </main>
        )}

        <Footer />

      </div>
    )
  }

  // PRIVATE USER DASHBOARD

  return (
    <div className="app">

      <nav className="navbar">
        <div className="container nav-content">

          <span className="brand">
            TaskFlow<span>.</span>
          </span>

          <div className="nav-actions">
            <span className="nav-username">
              {user.username}
            </span>

            <button
              className="outline-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>

        </div>
      </nav>

      <header className="dashboard-header">
        <div className="container">

          <span className="section-label">
            Your personal workspace
          </span>

          <h1>Welcome, {user.username}.</h1>

          <p>
            Organize your tasks. Focus on what matters.
          </p>

        </div>
      </header>

      <main className="container main">

        {/* TASK STATISTICS */}

        <section className="summary">

          <div>
            <span className="summary-label">
              Total tasks
            </span>

            <span className="summary-number">
              {tasks.length}
            </span>
          </div>

          <div>
            <span className="summary-label">
              Completed
            </span>

            <span className="summary-number completed-number">
              {completedCount}
            </span>
          </div>

          <div>
            <span className="summary-label">
              Remaining
            </span>

            <span className="summary-number">
              {tasks.length - completedCount}
            </span>
          </div>

        </section>

        {/* PROGRESS BAR */}

        <section className="panel progress-panel">

          <div className="progress-heading">
            <h2>Your progress</h2>
            <strong>{progress}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Task completion"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p>
            {completedCount} of {tasks.length} tasks completed.
          </p>

        </section>

        {/* ADD TASK FORM */}

        <section className="panel">

          <h2>Add a new task</h2>

          <p className="panel-description">
            What would you like to accomplish?
          </p>

          <form onSubmit={addTask}>

            <label htmlFor="task-title">
              Task title
            </label>

            <input
              id="task-title"
              type="text"
              value={title}
              maxLength={255}
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
              placeholder="Add more details..."
              rows={3}
            />

            <button
              className="primary-button"
              type="submit"
            >
              + Add Task
            </button>

          </form>

        </section>

        {/* TASK LIST */}

        <section className="panel">

          <div className="task-section-heading">
            <h2>Your tasks</h2>
            <span className="task-count">
              {tasks.length} tasks
            </span>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {tasks.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✓</div>
              <h3>A fresh start.</h3>
              <p>
                No tasks yet. Add your first task above!
              </p>
            </div>
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
                        maxLength={255}
                        onChange={(event) =>
                          setEditTitle(event.target.value)
                        }
                        required
                        autoFocus
                      />

                      <label
                        htmlFor={`edit-description-${task.id}`}
                      >
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
                          className="save-button"
                          type="submit"
                        >
                          Save Changes
                        </button>

                        <button
                          className="cancel-button"
                          type="button"
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
                        aria-label={`Mark ${task.title} ${
                          task.completed
                            ? 'incomplete'
                            : 'complete'
                        }`}
                        onChange={() => toggleTask(task)}
                      />

                      <div className="task-content">

                        <h3>{task.title}</h3>

                        {task.description && (
                          <p>{task.description}</p>
                        )}

                        <span
                          className={`task-status ${
                            task.completed
                              ? 'status-completed'
                              : 'status-pending'
                          }`}
                        >
                          {task.completed
                            ? 'Completed'
                            : 'Pending'}
                        </span>

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

      <Footer />

    </div>
  )
}

export default App
