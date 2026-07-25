// Estado de la aplicación
class LifeRoutineApp {
    constructor() {
        this.activities = [];
        this.challenges = [];
        this.currentView = 'daily';
        this.loadData();
        this.init();
    }

    loadData() {
        try {
            const savedActivities = localStorage.getItem('activities');
            this.activities = savedActivities ? JSON.parse(savedActivities) : [];
            
            const savedChallenges = localStorage.getItem('challenges');
            this.challenges = savedChallenges ? JSON.parse(savedChallenges) : [];
            
            console.log('Datos cargados:', { activities: this.activities.length, challenges: this.challenges.length });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.activities = [];
            this.challenges = [];
        }
    }

    init() {
        console.log('Inicializando app...');
        this.loadDefaultChallenges();
        this.renderDailyView();
        this.setupNavigation();
        this.setupActivityForm();
        this.updateDate();
        this.setupModalClose();
        console.log('App inicializada correctamente');
    }

    loadDefaultChallenges() {
        if (!this.challenges || this.challenges.length === 0) {
            this.challenges = [
                {
                    id: 'challenge-1',
                    name: '100 flexiones diarias',
                    category: 'health',
                    target: 100,
                    unit: 'flexiones',
                    period: 'daily',
                    progress: 0,
                    streak: 0
                },
                {
                    id: 'challenge-2',
                    name: 'Leer 300 páginas semanales',
                    category: 'intellectual',
                    target: 300,
                    unit: 'páginas',
                    period: 'weekly',
                    progress: 0,
                    streak: 0
                },
                {
                    id: 'challenge-3',
                    name: 'Meditar 10 minutos diarios',
                    category: 'health',
                    target: 10,
                    unit: 'minutos',
                    period: 'daily',
                    progress: 0,
                    streak: 0
                }
            ];
            this.saveChallenges();
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('Botones de navegación encontrados:', navButtons.length);
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Navegando a:', e.target.dataset.view);
                navButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.renderCurrentView();
            });
        });
    }

    setupActivityForm() {
        const form = document.getElementById('activity-form');
        if (!form) {
            console.error('Formulario no encontrado');
            return;
        }
        
        console.log('Configurando formulario de actividades');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Formulario enviado');
            
            const category = document.getElementById('activity-category').value;
            const name = document.getElementById('activity-name').value;
            const target = parseInt(document.getElementById('activity-target').value) || 0;
            const type = document.getElementById('activity-type').value;
            
            if (!name.trim()) {
                alert('Por favor ingresa un nombre para la actividad');
                return;
            }
            
            const activity = {
                id: Date.now().toString(),
                category: category,
                name: name.trim(),
                target: target,
                type: type,
                subActivities: this.getSubActivities(),
                completed: false,
                progress: 0,
                date: new Date().toDateString()
            };

            console.log('Nueva actividad creada:', activity);
            
            this.activities.push(activity);
            this.saveActivities();
            this.renderDailyView();
            this.closeModal();
            
            alert('✅ Actividad agregada exitosamente!');
        });
    }

    getSubActivities() {
        const subActivities = [];
        const inputs = document.querySelectorAll('.sub-activity-input');
        inputs.forEach(input => {
            if (input.value.trim()) {
                subActivities.push({
                    id: Date.now().toString() + Math.random(),
                    name: input.value.trim(),
                    completed: false
                });
            }
        });
        return subActivities;
    }

    renderCurrentView() {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`${this.currentView}-view`);
        
        if (!targetView) {
            console.error('Vista no encontrada:', this.currentView);
            return;
        }
        
        targetView.classList.add('active');
        
        switch(this.currentView) {
            case 'daily':
                this.renderDailyView();
                break;
            case 'challenges':
                this.renderChallengesView();
                break;
            case 'weekly':
                this.renderWeeklyView();
                break;
            case 'stats':
                this.renderStatsView();
                break;
        }
    }

    renderDailyView() {
        console.log('Renderizando vista diaria...');
        const today = new Date().toDateString();
        const todaysActivities = this.activities.filter(a => a.date === today);
        
        console.log('Actividades de hoy:', todaysActivities.length);
        
        const categories = ['work', 'health', 'intellectual', 'purpose'];
        
        categories.forEach(category => {
            const container = document.getElementById(`${category}-activities`);
            if (!container) {
                console.error('Contenedor no encontrado:', category);
                return;
            }
            
            const categoryActivities = todaysActivities.filter(a => a.category === category);
            console.log(`Actividades en ${category}:`, categoryActivities.length);
            
            if (categoryActivities.length === 0) {
                container.innerHTML = '<p style="color: #999; padding: 10px;">No hay actividades para hoy</p>';
            } else {
                container.innerHTML = categoryActivities.map(activity => this.createActivityHTML(activity)).join('');
                this.setupActivityListeners();
            }
        });

        this.updateProgressBar(todaysActivities);
    }

    createActivityHTML(activity) {
        const subActivitiesHTML = activity.subActivities && activity.subActivities.length > 0
            ? activity.subActivities.map(sub => `
                <div class="sub-activity">
                    <input type="checkbox" class="sub-checkbox" data-sub-id="${sub.id}" 
                           ${sub.completed ? 'checked' : ''} 
                           onchange="app.toggleSubActivity('${activity.id}', '${sub.id}')">
                    <span style="${sub.completed ? 'text-decoration: line-through;' : ''}">${sub.name}</span>
                </div>
            `).join('')
            : '';

        const counterHTML = activity.type === 'counter'
            ? `<div class="counter-controls">
                <button class="counter-btn" onclick="app.updateCounter('${activity.id}', -1)">-</button>
                <span class="counter-value">${activity.progress || 0}</span>
                <button class="counter-btn" onclick="app.updateCounter('${activity.id}', 1)">+</button>
               </div>`
            : '';

        return `
            <div class="activity-item ${activity.completed ? 'completed' : ''}" data-id="${activity.id}">
                <input type="checkbox" class="activity-checkbox" 
                       ${activity.completed ? 'checked' : ''} 
                       onchange="app.toggleActivity('${activity.id}')">
                <div style="flex: 1;">
                    <strong>${activity.name}</strong>
                    ${activity.target > 0 ? `<br><small>Meta: ${activity.progress || 0}/${activity.target}</small>` : ''}
                    ${subActivitiesHTML}
                </div>
                ${counterHTML}
            </div>
        `;
    }

    toggleActivity(activityId) {
        console.log('Toggle activity:', activityId);
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
            activity.completed = !activity.completed;
            this.saveActivities();
            this.renderDailyView();
            
            if (activity.completed) {
                this.celebrate();
            }
        }
    }

    toggleSubActivity(activityId, subId) {
        console.log('Toggle sub-activity:', activityId, subId);
        const activity = this.activities.find(a => a.id === activityId);
        if (activity && activity.subActivities) {
            const sub = activity.subActivities.find(s => s.id === subId);
            if (sub) {
                sub.completed = !sub.completed;
                this.saveActivities();
                this.renderDailyView();
            }
        }
    }

    updateCounter(activityId, change) {
        console.log('Update counter:', activityId, change);
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
            activity.progress = Math.max(0, (activity.progress || 0) + change);
            
            if (activity.target > 0 && activity.progress >= activity.target) {
                activity.completed = true;
                this.celebrate();
            }
            
            this.saveActivities();
            this.renderDailyView();
        }
    }

    setupActivityListeners() {
        console.log('Listeners configurados correctamente');
    }

    renderChallengesView() {
        console.log('Renderizando retos...');
        const container = document.getElementById('challenges-container');
        if (!container) {
            console.error('Contenedor de retos no encontrado');
            return;
        }

        if (this.challenges.length === 0) {
            container.innerHTML = '<p style="color: #999; padding: 20px;">No hay retos activos</p>';
            return;
        }

        container.innerHTML = this.challenges.map(challenge => `
            <div class="challenge-card">
                <h3>${challenge.name}</h3>
                <p>📊 Progreso: ${challenge.progress || 0} / ${challenge.target} ${challenge.unit}</p>
                <div class="challenge-progress">
                    <div class="challenge-fill" style="width: ${Math.min(100, ((challenge.progress || 0) / challenge.target) * 100)}%"></div>
                </div>
                <p>🔥 Racha: ${challenge.streak || 0} días</p>
            </div>
        `).join('');
    }

    renderWeeklyView() {
        const container = document.getElementById('week-grid');
        if (!container) return;
        
        container.innerHTML = '<p style="padding: 20px; color: #999;">Vista semanal en desarrollo</p>';
    }

    renderStatsView() {
        const container = document.getElementById('stats-view');
        if (!container) return;
        
        const totalActivities = this.activities.length;
        const completedToday = this.activities.filter(a => 
            a.date === new Date().toDateString() && a.completed
        ).length;
        
        container.innerHTML = `
            <div style="padding: 20px;">
                <h3>📊 Tus Estadísticas</h3>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin: 10px 0;">
                    <p>✅ Completadas hoy: ${completedToday}</p>
                    <p>📝 Total actividades: ${totalActivities}</p>
                </div>
            </div>
        `;
    }

    saveActivities() {
        try {
            localStorage.setItem('activities', JSON.stringify(this.activities));
            console.log('Actividades guardadas:', this.activities.length);
        } catch (error) {
            console.error('Error guardando actividades:', error);
        }
    }

    saveChallenges() {
        try {
            localStorage.setItem('challenges', JSON.stringify(this.challenges));
            console.log('Retos guardados:', this.challenges.length);
        } catch (error) {
            console.error('Error guardando retos:', error);
        }
    }

    updateProgressBar(activities) {
        const progressBar = document.getElementById('daily-progress');
        if (!progressBar) return;
        
        if (activities.length === 0) {
            progressBar.style.width = '0%';
            return;
        }
        
        const completed = activities.filter(a => a.completed).length;
        const percentage = (completed / activities.length) * 100;
        progressBar.style.width = percentage + '%';
        progressBar.textContent = percentage > 10 ? Math.round(percentage) + '%' : '';
    }

    updateDate() {
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString('es-ES', options);
        }
    }

    setupModalClose() {
        const modal = document.getElementById('activity-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('activity-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('activity-form').reset();
            document.getElementById('sub-activities-list').innerHTML = '';
        }
    }

    celebrate() {
        // Efecto visual simple
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.transform = 'scale(1.02)';
            setTimeout(() => {
                appContainer.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Mostrar mensaje
        this.showToast('🎉 ¡Completado!');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Variables globales
let app;

// Funciones globales para los botones
function addActivity(category) {
    console.log('Abriendo modal para categoría:', category);
    const modal = document.getElementById('activity-modal');
    const categoryInput = document.getElementById('activity-category');
    
    if (modal && categoryInput) {
        modal.style.display = 'block';
        categoryInput.value = category;
        document.getElementById('activity-name').focus();
    } else {
        console.error('Modal o input no encontrados');
    }
}

function addSubActivity() {
    const list = document.getElementById('sub-activities-list');
    if (list) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sub-activity-input';
        input.placeholder = 'Nombre del item';
        input.style.cssText = 'width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px;';
        list.appendChild(input);
        input.focus();
    }
}

function closeModal() {
    if (app) {
        app.closeModal();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');
    app = new LifeRoutineApp();
    
    // Exponer funciones globalmente
    window.app = app;
    window.addActivity = addActivity;
    window.addSubActivity = addSubActivity;
    window.closeModal = closeModal;
    
    console.log('Aplicación lista para usar');
});

// También intentar inicializar inmediatamente por si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM ya cargado, inicializando inmediatamente...');
    setTimeout(() => {
        app = new LifeRoutineApp();
        window.app = app;
        window.addActivity = addActivity;
        window.addSubActivity = addSubActivity;
        window.closeModal = closeModal;
    }, 100);
}