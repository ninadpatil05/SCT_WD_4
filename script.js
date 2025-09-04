document.addEventListener('DOMContentLoaded', () => {
    // Elements (existing)
    const body = document.body;
    const taskModal = document.getElementById('task-modal');
    const categoryModal = document.getElementById('category-modal');
    const statsModal = document.getElementById('stats-modal');
    const customAlertModal = document.getElementById('custom-alert-modal');
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const taskForm = document.getElementById('task-form');
    const tasksContainer = document.getElementById('tasks-container');
    const taskModalTitle = document.getElementById('task-modal-title');
    const hiddenTaskId = document.getElementById('task-id');
    const sidebarNav = document.querySelector('aside nav');
    const taskFiltersContainer = document.querySelector('.task-filters');
    const pageTitle = document.getElementById('page-title');
    const searchInput = document.getElementById('search-input');
    const categoryForm = document.getElementById('category-form');
    const categoriesListContainer = document.getElementById('categories-list');
    const colorPicker = document.querySelector('.color-picker');
    const taskCategoryDropdown = document.getElementById('task-category');
    const subtasksContainer = document.getElementById('subtasks-container');
    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    const backupMenu = document.getElementById('backup-menu');
    const backupBtn = document.getElementById('backup-btn');
    const exportBtn = document.getElementById('export-btn');
    const importInput = document.getElementById('import-input');
    const statsBtn = document.getElementById('stats-btn');
    const modalCloseBtns = document.querySelectorAll('.modal-close-btn');
    const modalCancelBtns = document.querySelectorAll('.modal-cancel-btn');
    const statsGridModal = document.getElementById('stats-grid-modal');
    const viewTabs = document.querySelector('.view-tabs');
    const listContainer = document.getElementById('list-container');
    const kanbanContainer = document.getElementById('kanban-container');
    const calendarContainer = document.getElementById('calendar-container');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const analyticsContainer = document.getElementById('analytics-container');

    // Time tracking buttons
    const timeTrackingGroup = taskForm.querySelector('.time-tracking-group');
    const timeTrackedDisplay = document.getElementById('time-tracked');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const stopTimerBtn = document.getElementById('stop-timer-btn');
    const resetTimerBtn = document.getElementById('reset-timer-btn');

    // Application state
    let tasks = [];
    let categories = [
        { id: 1, name: 'Personal', color: '#3b82f6' },
        { id: 2, name: 'Work', color: '#10b981' },
        { id: 3, name: 'Study', color: '#f59e0b' }
    ];
    let state = { activeSidebarView: 'tasks', activeFilter: 'all', searchTerm: '', currentDate: new Date() };

    // Time tracking state for current task modal
    let timerInterval = null;
    let timerSeconds = 0;

    // Persistence
    const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));
    const loadTasks = () => { if (localStorage.getItem('tasks')) tasks = JSON.parse(localStorage.getItem('tasks')); };
    const saveCategories = () => localStorage.setItem('categories', JSON.stringify(categories));
    const loadCategories = () => { if (localStorage.getItem('categories')) categories = JSON.parse(localStorage.getItem('categories')); };

    // Custom modals
    const showAlert = (message, title = "Notification") => {
        document.getElementById('custom-alert-title').textContent = title;
        document.getElementById('custom-alert-message').textContent = message;
        const alertOkBtn = document.getElementById('custom-alert-ok');
        showModal(customAlertModal);
        alertOkBtn.onclick = () => hideAllModals();
    };
    const showConfirm = (message, title = "Confirmation") => {
        return new Promise((resolve) => {
            document.getElementById('custom-confirm-title').textContent = title;
            document.getElementById('custom-confirm-message').textContent = message;
            const okBtn = document.getElementById('custom-confirm-ok');
            const cancelBtn = document.getElementById('custom-confirm-cancel');
            showModal(customConfirmModal);
            okBtn.onclick = () => { hideAllModals(); resolve(true); };
            cancelBtn.onclick = () => { hideAllModals(); resolve(false); };
        });
    };

    // Theme Switching with auto-detect
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.dataset.theme = savedTheme;
    } else if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.dataset.theme = prefersDark ? 'dark' : 'light';
        localStorage.setItem('theme', body.dataset.theme);
    }
    themeToggleBtn.addEventListener('click', () => {
        body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', body.dataset.theme);
    });

    // Modal Handling
    const showModal = (modal) => modal.classList.add('active');
    const hideAllModals = () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
        stopTimer(); // stop time tracker
    };
    addTaskBtn.addEventListener('click', () => showTaskModal(null));
    addCategoryBtn.addEventListener('click', () => showModal(categoryModal));
    statsBtn.addEventListener('click', () => {
        updateStats();
        showModal(statsModal);
    });
    modalCloseBtns.forEach(btn => btn.addEventListener('click', hideAllModals));
    modalCancelBtns.forEach(btn => btn.addEventListener('click', hideAllModals));
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === e.currentTarget) hideAllModals(); });
    });

    // Category Management
    const renderCategories = () => {
        categoriesListContainer.innerHTML = '';
        if (categories.length === 0) {
            categoriesListContainer.innerHTML = '<p class="placeholder">No categories yet.</p>';
            return;
        }
        categories.forEach((cat, index) => {
            const el = document.createElement('div');
            el.className = 'category-item';
            el.dataset.id = cat.id;
            el.innerHTML = `<div><span class="category-color" style="background-color: ${cat.color};"></span><span class="category-name">${cat.name}</span></div>
            <div class="category-actions">
                <button class="move-btn" data-direction="up" title="Move up" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                <button class="move-btn" data-direction="down" title="Move down" ${index === categories.length - 1 ? 'disabled' : ''}>&darr;</button>
                <button class="delete-btn" title="Delete category">&times;</button>
            </div>`;
            categoriesListContainer.appendChild(el);
        });
        updateTaskCategoryDropdown();
    };
    const updateTaskCategoryDropdown = () => {
        const currentVal = taskCategoryDropdown.value;
        taskCategoryDropdown.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            taskCategoryDropdown.appendChild(option);
        });
        taskCategoryDropdown.value = currentVal;
    };
    colorPicker.addEventListener('click', e => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
    categoryForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('category-name').value.trim();
        const selectedColorEl = document.querySelector('.color-option.selected');
        if (!name || !selectedColorEl) return showAlert('Name and color are required.');
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return showAlert('Category name already exists.');
        categories.push({ id: Date.now(), name, color: selectedColorEl.dataset.color });
        saveCategories();
        renderCategories();
        categoryForm.reset();
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        hideAllModals();
    });
    categoriesListContainer.addEventListener('click', async e => {
        const catItem = e.target.closest('.category-item');
        if (!catItem) return;
        const catId = Number(catItem.dataset.id);
        const index = categories.findIndex(c => c.id === catId);
        if (e.target.closest('.delete-btn')) {
            if (await showConfirm(`Delete "${categories[index].name}"?`)) {
                categories.splice(index, 1);
                saveCategories();
                renderCategories();
            }
        }
        if (e.target.closest('.move-btn')) {
            const dir = e.target.closest('.move-btn').dataset.direction;
            if (dir === 'up' && index > 0) [categories[index], categories[index - 1]] = [categories[index - 1], categories[index]];
            else if (dir === 'down' && index < categories.length - 1) [categories[index], categories[index + 1]] = [categories[index + 1], categories[index]];
            saveCategories();
            renderCategories();
        }
    });

    // Subtask handlers
    const createSubtaskInput = (subtask = { id: Date.now() + Math.random(), text: '', completed: false }) => {
        const item = document.createElement('div');
        item.className = 'subtask-item';
        item.dataset.id = subtask.id;
        item.innerHTML = `<input type="text" class="form-input subtask-input" value="${subtask.text}" placeholder="Enter subtask..." /><button type="button" class="remove-subtask">&times;</button>`;
        subtasksContainer.appendChild(item);
    };
    addSubtaskBtn.addEventListener('click', () => createSubtaskInput());
    subtasksContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-subtask')) e.target.parentElement.remove(); });

    // Update Task Counts (including recurring count)
    const updateTaskCounts = () => {
        const completedCount = tasks.filter(t => t.completed).length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()).length;
        const upcomingCount = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) > today).length;
        const recurringCount = tasks.filter(t => t.recurring && t.recurring !== 'none').length;
        document.getElementById('total-tasks').textContent = tasks.filter(t => !t.completed).length;
        document.getElementById('today-tasks').textContent = todayCount;
        document.getElementById('upcoming-tasks').textContent = upcomingCount;
        document.getElementById('completed-tasks').textContent = completedCount;

        const recurringFilterBtn = document.querySelector('.filter-btn[data-filter="recurring"]');
        if (recurringFilterBtn) {
            recurringFilterBtn.setAttribute('data-count', recurringCount);
            recurringFilterBtn.title = `${recurringCount} recurring tasks`;
        }
    };

    // Time tracking timer helpers
    const updateTimeDisplay = () => {
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        timeTrackedDisplay.textContent = `${minutes}m ${seconds}s`;
    };
    const startTimer = () => {
        startTimerBtn.disabled = true;
        stopTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimeDisplay();
        }, 1000);
    };
    const stopTimer = () => {
        startTimerBtn.disabled = false;
        stopTimerBtn.disabled = true;
        resetTimerBtn.disabled = false;
        if (timerInterval) clearInterval(timerInterval);
    };
    const resetTimer = () => {
        stopTimer();
        timerSeconds = 0;
        updateTimeDisplay();
        resetTimerBtn.disabled = true;
    };
    startTimerBtn.addEventListener('click', startTimer);
    stopTimerBtn.addEventListener('click', stopTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    // Show Task Modal with recurring, notes and time tracking
    const showTaskModal = (task = null, dueDate = null) => {
        taskForm.reset();
        subtasksContainer.innerHTML = '';
        resetTimer();
        timeTrackingGroup.style.display = 'flex';

        if (task) {
            taskModalTitle.textContent = 'Edit Task';
            hiddenTaskId.value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            taskCategoryDropdown.value = task.category;
            document.getElementById('task-recurring').value = task.recurring || 'none';
            document.getElementById('task-notes').value = task.notes || '';
            if (task.dueDate) {
                const d = new Date(task.dueDate);
                document.getElementById('task-due-date').value = d.toISOString().slice(0, 10);
                document.getElementById('task-due-time').value = d.toTimeString().slice(0, 5);
            } else {
                document.getElementById('task-due-date').value = '';
                document.getElementById('task-due-time').value = '';
            }
            if (task.subtasks) task.subtasks.forEach(createSubtaskInput);

            timerSeconds = task.timeTracked || 0;
            updateTimeDisplay();

        } else {
            taskModalTitle.textContent = 'Add New Task';
            hiddenTaskId.value = '';
            document.getElementById('task-recurring').value = 'none';
            document.getElementById('task-notes').value = '';
            if (dueDate) {
                document.getElementById('task-due-date').value = dueDate;
            }
        }
        showModal(taskModal);
    };

    // Render tasks list with gamification badge, notes preview, recurring filter support
    const renderTasks = () => {
        updateActiveElements();
        updateTaskCounts();

        let tasksToRender = [...tasks];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (state.activeSidebarView === 'today')
            tasksToRender = tasksToRender.filter(t => !t.completed && t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime());
        else if (state.activeSidebarView === 'upcoming')
            tasksToRender = tasksToRender.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) > today);
        else if (state.activeSidebarView === 'completed')
            tasksToRender = tasksToRender.filter(t => t.completed);

        if (state.activeFilter !== 'all') {
            if (state.activeFilter === 'overdue')
                tasksToRender = tasksToRender.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
            else if (state.activeFilter === 'recurring')
                tasksToRender = tasksToRender.filter(t => t.recurring && t.recurring !== 'none');
            else
                tasksToRender = tasksToRender.filter(t => t.priority === state.activeFilter);
        }

        if (state.searchTerm) {
            tasksToRender = tasksToRender.filter(t => t.title.toLowerCase().includes(state.searchTerm) || (t.description && t.description.toLowerCase().includes(state.searchTerm)));
        }

        tasksContainer.innerHTML = '';
        if (tasksToRender.length === 0) {
            tasksContainer.innerHTML = '<p class="placeholder">No tasks match the current view.</p>';
            return;
        }

        tasksToRender.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.dataset.id = task.id;
            taskEl.setAttribute('draggable', 'true');
            const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
            if (isOverdue) taskEl.style.borderLeftColor = 'var(--danger-color)';
            if (task.completed) taskEl.classList.add('task-completed');

            // Gamification badge example: "Streak" if completed on time
            let badgeHTML = '';
            if (task.completed && task.dueDate && new Date(task.dueDate) >= new Date(task.completedDate || 0)) {
                badgeHTML = `<span class="task-badge" title="Completed on time">🏆</span>`;
            }

            let subtasksHTML = '';
            if (task.subtasks && task.subtasks.length > 0) {
                const completedCount = task.subtasks.filter(st => st.completed).length;
                const progress = (completedCount / task.subtasks.length) * 100;
                subtasksHTML = `<div class="task-subtasks"><div class="progress-bar"><div class="progress-fill" style="width: ${progress}%;"></div></div>${task.subtasks.map(st =>
                    `<div class="subtask-list-item ${st.completed ? 'completed' : ''}"><input id="subtask-${st.id}" type="checkbox" class="subtask-checkbox" data-subtask-id="${st.id}" ${st.completed ? 'checked' : ''}><label for="subtask-${st.id}">${st.text}</label></div>`
                ).join('')}</div>`;
            }

            const notePreview = task.notes ? `<div class="task-notes-preview">${task.notes.length > 100 ? task.notes.slice(0, 100) + '...' : task.notes}</div>` : '';

            const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
            taskEl.innerHTML = `
                <div class="task-header">
                    <span class="task-title">${task.title}${badgeHTML}</span>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="task-content">
                    <p class="task-description">${task.description || 'No description.'}</p>
                    ${notePreview}
                </div>
                <div class="task-meta">
                    <span><i class="fas fa-calendar"></i> ${isOverdue ? 'Overdue' : formattedDate}</span>
                    <span><i class="fas fa-tag"></i> ${task.category}</span>
                    <span><i class="fas fa-sync-alt"></i> ${task.recurring && task.recurring !== 'none' ? capitalize(task.recurring) : 'No'}</span>
                    <span><i class="fas fa-clock"></i> ${formatTimeTracked(task.timeTracked)}</span>
                </div>
                ${subtasksHTML}
                <div class="task-actions">
                    <button class="task-action complete-btn" title="Mark as complete"><i class="fas fa-check"></i> ${task.completed ? 'Undo' : 'Complete'}</button>
                    <button class="task-action edit-btn" title="Edit task"><i class="fas fa-edit"></i> Edit</button>
                    <button class="task-action delete-btn" title="Delete task"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            tasksContainer.appendChild(taskEl);
        });

        // Enable drag & drop on tasks list
        enableTaskDragDrop();

        // Kanban rendering if active
        if (document.querySelector('.tab.active').dataset.tab === 'kanban') {
            renderKanban();
        }
    };

    // Capitalize helper
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Format time tracked seconds to m:s
    function formatTimeTracked(seconds = 0) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    }

    // Drag and drop reorder for List View tasks
    const enableTaskDragDrop = () => {
        let draggedEl = null;

        tasksContainer.addEventListener('dragstart', (e) => {
            draggedEl = e.target.closest('.task-item');
            if (!draggedEl) return;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedEl.dataset.id);
            draggedEl.classList.add('dragging');
        });

        tasksContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const target = e.target.closest('.task-item');
            if (!target || target === draggedEl) return;

            const bounding = target.getBoundingClientRect();
            const offset = e.clientY - bounding.top;
            const container = tasksContainer;

            if (offset > bounding.height / 2) {
                container.insertBefore(draggedEl, target.nextSibling);
            } else {
                container.insertBefore(draggedEl, target);
            }
        });

        tasksContainer.addEventListener('dragend', () => {
            if (!draggedEl) return;
            draggedEl.classList.remove('dragging');
            draggedEl = null;

            // Update tasks array order based on new visual order
            const newOrderIds = Array.from(tasksContainer.children)
                .filter(el => el.classList.contains('task-item'))
                .map(el => Number(el.dataset.id));

            tasks = newOrderIds.map(id => tasks.find(t => t.id === id));
            saveTasks();
            renderTasks(); // Re-render to refresh UI
        });
    };

    // Render Kanban with drag/drop
    const renderKanban = () => {
        const todoContainer = document.getElementById('kanban-todo');
        const inProgressContainer = document.getElementById('kanban-in-progress');
        const doneContainer = document.getElementById('kanban-done');

        [todoContainer, inProgressContainer, doneContainer].forEach(col => col.innerHTML = '');

        tasks.forEach(task => {
            if (!task.status) task.status = 'todo';

            const taskEl = document.createElement('div');
            taskEl.className = 'kanban-task-item' + (task.completed ? ' task-completed' : '');
            taskEl.draggable = true;
            taskEl.dataset.id = task.id;
            taskEl.textContent = task.title.length > 30 ? task.title.slice(0, 30) + '…' : task.title;

            taskEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
            });

            if (task.status === 'todo') todoContainer.appendChild(taskEl);
            else if (task.status === 'in-progress') inProgressContainer.appendChild(taskEl);
            else doneContainer.appendChild(taskEl);
        });

        document.querySelectorAll('.kanban-column').forEach(column => {
            column.ondragover = (e) => e.preventDefault();
            column.ondrop = (e) => {
                e.preventDefault();
                const taskId = Number(e.dataTransfer.getData('text/plain'));
                const newStatus = column.dataset.status;
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    saveTasks();
                    renderTasks();
                }
            };
        });
    };

    // Form submit extended with recurring, notes, timer, status
    taskForm.addEventListener('submit', async event => {
        event.preventDefault();

        const id = hiddenTaskId.value;
        const subtaskInputs = subtasksContainer.querySelectorAll('.subtask-item');
        let subtasksData = [];

        const dateValue = document.getElementById('task-due-date').value;
        const timeValue = document.getElementById('task-due-time').value;
        let dueDate = null;
        if (dateValue) dueDate = new Date(`${dateValue}T${timeValue || '00:00'}`).toISOString();

        if (id) {
            const originalTask = tasks.find(t => t.id == id);
            subtasksData = Array.from(subtaskInputs).map(item => {
                const subtaskId = Number(item.dataset.id);
                const text = item.querySelector('.subtask-input').value;
                const existingSubtask = originalTask.subtasks ? originalTask.subtasks.find(st => st.id === subtaskId) : null;
                return { id: subtaskId, text, completed: existingSubtask ? existingSubtask.completed : false };
            }).filter(st => st.text.trim() !== '');
        } else {
            subtasksData = Array.from(subtaskInputs).map(item => ({
                id: Date.now() + Math.random(),
                text: item.querySelector('.subtask-input').value,
                completed: false
            })).filter(st => st.text.trim() !== '');
        }

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            category: taskCategoryDropdown.value,
            dueDate: dueDate,
            subtasks: subtasksData,
            recurring: document.getElementById('task-recurring').value || 'none',
            notes: document.getElementById('task-notes').value || '',
            timeTracked: timerSeconds,
            status: (id && tasks.find(t => t.id == id).status) || 'todo',
            completedDate: tasks.find(t => t.id == id)?.completedDate || null
        };

        if (id) {
            const taskIndex = tasks.findIndex(t => t.id == id);
            if (taskIndex > -1) tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
        } else {
            tasks.push({ id: Date.now(), ...taskData, completed: false, reminderSent: false, postDeadlineCheck: false });
        }

        saveTasks();
        renderTasks();
        renderCalendar();
        hideAllModals();
    });

    // Task actions container (completion, edit, delete, subtask checkbox)
    tasksContainer.addEventListener('click', async (event) => {
        const target = event.target;
        const taskElement = target.closest('.task-item');
        if (!taskElement) return;
        const taskId = Number(taskElement.dataset.id);
        const task = tasks.find(t => t.id === taskId);

        if (target.matches('.subtask-checkbox')) {
            const subtaskId = Number(target.dataset.subtaskId);
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                subtask.completed = target.checked;
                saveTasks();
                renderTasks();
            }
            return;
        }

        if (target.closest('.edit-btn')) showTaskModal(task);
        else if (target.closest('.delete-btn')) {
            if (await showConfirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
                renderCalendar();
            }
        } else if (target.closest('.complete-btn')) {
            if (!task.completed && !(await showConfirm('Mark this task as complete?'))) return;
            task.completed = !task.completed;
            task.completedDate = task.completed ? new Date().toISOString() : null;
            saveTasks();
            renderTasks();
            renderCalendar();
        }
    });

    // Stats update
    const updateStats = () => {
        const totalTasks = tasks.length;
        if (totalTasks === 0) {
            statsGridModal.innerHTML = '<p class="placeholder">No data available to generate stats.</p>';
            return;
        }
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = Math.round((completedTasks / totalTasks) * 100);
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const tasksThisWeek = tasks.filter(t => t.completed && new Date(t.completedDate) >= oneWeekAgo).length;
        const firstTaskDate = tasks.length > 0 ? new Date(tasks.sort((a, b) => a.id - b.id)[0].id) : new Date();
        const daysSinceFirstTask = Math.max(1, Math.ceil((now - firstTaskDate) / (1000 * 60 * 60 * 24)));
        const dailyAverage = (completedTasks / daysSinceFirstTask).toFixed(1);
        statsGridModal.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${completionRate}%</div>
                <div class="stat-label">Overall Completion Rate</div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${completionRate}%;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${tasksThisWeek}</div>
                <div class="stat-label">Tasks This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dailyAverage}</div>
                <div class="stat-label">Daily Average</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalTasks - completedTasks}</div>
                <div class="stat-label">Pending Tasks</div>
            </div>
        `;
    };

    // Analytics View Rendering
    const renderAnalytics = () => {
        if (tasks.length === 0) {
            analyticsContainer.innerHTML = '<p class="placeholder">No task data available for analytics.</p>';
            return;
        }

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        const priorities = { high: 0, medium: 0, low: 0 };
        tasks.forEach(t => {
            if (priorities[t.priority] !== undefined) priorities[t.priority]++;
        });

        analyticsContainer.innerHTML = `
          <div class="stat-card">
            <div class="stat-value">${totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completedTasks}</div>
            <div class="stat-label">Completed Tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${pendingTasks}</div>
            <div class="stat-label">Pending Tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${priorities.high}</div>
            <div class="stat-label">High Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${priorities.medium}</div>
            <div class="stat-label">Medium Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${priorities.low}</div>
            <div class="stat-label">Low Priority</div>
          </div>
        `;
    };

    // Calendar render unchanged
    const renderCalendar = () => {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();

        calendarMonthYear.textContent = `${state.currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        calendarGrid.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'calendar-day day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            const date = new Date(year, month, day);
            dayEl.dataset.date = date.toISOString().slice(0, 10);

            if (date.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }

            const tasksForDay = tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate.getFullYear() === year && taskDate.getMonth() === month && taskDate.getDate() === day;
            });

            dayEl.innerHTML = `<div class="day-number">${day}</div><div class="day-tasks">${tasksForDay.map(t => `<div class="day-task">${t.title}</div>`).join('')}</div>`;
            calendarGrid.appendChild(dayEl);
        }
    };
    prevMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });
    nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
    calendarGrid.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day');
        if (dayEl && dayEl.dataset.date) {
            showTaskModal(null, dayEl.dataset.date);
        }
    });

    // View and Filter Clicks
    const updateActiveElements = () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === state.activeSidebarView));
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === state.activeFilter));
        const activeViewElement = document.querySelector(`.nav-item[data-view="${state.activeSidebarView}"] span`);
        if (activeViewElement) pageTitle.textContent = activeViewElement.textContent;
    };

    sidebarNav.addEventListener('click', e => {
        const navItem = e.target.closest('.nav-item');
        if (navItem && navItem.dataset.view) {
            state.activeSidebarView = navItem.dataset.view;
            renderTasks();
        }
    });
    taskFiltersContainer.addEventListener('click', e => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn && filterBtn.dataset.filter) {
            state.activeFilter = filterBtn.dataset.filter;
            renderTasks();
        }
    });
    searchInput.addEventListener('input', () => {
        state.searchTerm = searchInput.value.toLowerCase().trim();
        renderTasks();
    });

    viewTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const activeTab = tab.dataset.tab;
        listContainer.classList.toggle('active', activeTab === 'list');
        calendarContainer.classList.toggle('active', activeTab === 'calendar');
        kanbanContainer.style.display = activeTab === 'kanban' ? 'flex' : 'none';
        analyticsContainer.style.display = activeTab === 'analytics' ? 'block' : 'none';

        if (activeTab === 'calendar') renderCalendar();
        if (activeTab === 'kanban') renderKanban();
        if (activeTab === 'analytics') renderAnalytics();
    });

    // Deadline Checker & Backup
    const checkDeadlines = async () => {
        const now = new Date();
        for (const task of tasks) {
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate - now;

                if (timeDiff > 0 && timeDiff < 15 * 60 * 1000 && !task.reminderSent) {
                    showAlert(`Your task "${task.title}" is due in less than 15 minutes!`, "Reminder");
                    task.reminderSent = true;
                    saveTasks();
                }

                if (timeDiff < 0 && !task.postDeadlineCheck) {
                    const confirmed = await showConfirm(`The deadline for "${task.title}" has passed. Did you complete it?`);
                    if (confirmed) {
                        task.completed = true;
                        task.completedDate = new Date().toISOString();
                    }
                    task.postDeadlineCheck = true;
                    saveTasks();
                    renderTasks();
                    renderCalendar();
                }
            }
        }
    };

    const toggleBackupMenu = () => backupMenu.classList.toggle('visible');
    const exportData = () => {
        if (tasks.length === 0 && categories.length <= 3) return showAlert("Nothing to export!");
        const dataToExport = { tasks, categories };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toggleBackupMenu();
    };
    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data.tasks) && Array.isArray(data.categories)) {
                    if (await showConfirm('Importing will overwrite all current data. Are you sure?')) {
                        tasks = data.tasks;
                        categories = data.categories;
                        saveTasks();
                        saveCategories();
                        renderTasks();
                        renderCategories();
                        showAlert('Data imported successfully!');
                    }
                } else showAlert('Invalid backup file format.');
            } catch (error) {
                showAlert('Error reading or parsing the backup file.');
            } finally {
                event.target.value = '';
                toggleBackupMenu();
            }
        };
        reader.readAsText(file);
    };

    backupBtn.addEventListener('click', toggleBackupMenu);
    exportBtn.addEventListener('click', exportData);
    importInput.addEventListener('change', importData);
    document.addEventListener('click', (e) => {
        if (!backupBtn.contains(e.target) && !backupMenu.contains(e.target)) {
            backupMenu.classList.remove('visible');
        }
    });

    // Initial Load
    loadTasks();
    loadCategories();
    renderTasks();
    renderCategories();
    setInterval(checkDeadlines, 60000); // Check once per minute
});
