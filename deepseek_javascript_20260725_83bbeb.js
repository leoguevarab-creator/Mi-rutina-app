// Estado de la aplicación
class LifeRoutineApp {
    constructor() {
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.challenges = JSON.parse(localStorage.getItem('challenges')) || [];
        this.currentView = 'daily';
        this.init();
    }

    init() {
        this.loadDefaultChallenges();
        this.renderCurrentView();
        this.setupNavigation();
        this.setupActivityForm();
        this.updateDate();
        this.checkDailyReset();
    }

    // Cargar retos predeterminados
    loadDefaultChallenges() {
        if (this.challenges.length === 0) {
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
                },
                {
                    id: 'challenge-4',
                    name: 'Escribir 500 palabras diarias',
                    category: 'purpose',
                    target: 500,
                    unit: 'palabras',
                    period: 'daily',
                    progress: 0,
                    streak: 0
                }
            ];
            this.saveChallenges();
        }
    }

    // Navegación
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.renderCurrentView();
            });
        });
    }

    // Formulario de actividades
    setupActivityForm() {
        document.getElementById('activity-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const activity = {
                id: Date.now().toString(),
                category: document.getElementById('activity-category').value,
                name: document.getElementById('activity-name').value,
                target: parseInt(document.getElementById('activity-target').value) || 0,
                type: document.getElementById('activity-type').value,
                subActivities: this.getSubActivities(),
                completed: false,
                progress: 0,
                date: new Date().toDateString()
            };

            this.activities.push(activity);
            this.saveActivities();
            this.renderCurrentView();
            this.closeModal();
            this.showNotification('Actividad agregada exitosamente! 🎉');
        });
    }

    getSubActivities() {
        const subActivities = [];
        document.querySelectorAll('.sub-activity-input').forEach(input => {
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

    // Renderizado de vistas
    renderCurrentView() {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        switch(this.currentView) {
            case 'daily':
                this.renderDailyView();
                break;
            case 'weekly':
                this.renderWeeklyView();
                break;
            case 'monthly':
                this.renderMonthlyView();
                break;
            case 'challenges':
                this.renderChallengesView();
                break;
            case 'stats':
                this.renderStatsView();
                break;
        }
        
        document.getElementById(`${this.currentView}-view`).classList.add('active');
    }

    renderDailyView() {
        const today = new Date().toDateString();
        const todaysActivities = this.activities.filter(a => a.date === today);
        
        // Renderizar actividades por categoría
        ['work', 'health', 'intellectual', 'purpose'].forEach(category => {
            const container = document.getElementById(`${category}-activities`);
            const categoryActivities = todaysActivities.filter(a => a.category === category);
            
            container.innerHTML = categoryActivities.map(activity => this.createActivityHTML(activity)).join('');
            
            // Agregar event listeners
            this.setupActivityListeners();
        });

        // Actualizar barra de progreso
        this.updateProgressBar(todaysActivities);
    }

    createActivityHTML(activity) {
        return `
            <div class="activity-item ${activity.completed ? 'completed' : ''}" data-id="${activity.id}">
                <input type="checkbox" class="activity-checkbox" ${activity.completed ? 'checked' : ''}>
                <div>
                    <strong>${activity.name}</strong>
                    ${activity.target > 0 ? `<span class="counter-value">${activity.progress}/${activity.target}</span>` : ''}
                    ${activity.subActivities.map(sub => `
                        <div class="sub-activity">
                            <input type="checkbox" class="sub-checkbox" data-sub-id="${sub.id}" ${sub.completed ? 'checked' : ''}>
                            ${sub.name}
                        </div>
                    `).join('')}
                </div>
                ${activity.type === 'counter' ? `
                    <div class="counter-controls">
                        <button class="counter-btn" data-action="decrement">-</button>
                        <span class="counter-value">${activity.progress}</span>
                        <button class="counter-btn" data-action="increment">+</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupActivityListeners() {
        document.querySelectorAll('.activity-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const activityId = e.target.closest('.activity-item').dataset.id;
                const activity = this.activities.find(a => a.id === activityId);
                if (activity) {
                    activity.completed = e.target.checked;
                    this.saveActivities();
                    this.renderDailyView();
                    
                    if (activity.completed) {
                        this.checkChallengeProgress(activity);
                        this.celebrate();
                    }
                }
            });
        });

        document.querySelectorAll('.counter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activityId = e.target.closest('.activity-item').dataset.id;
                const activity = this.activities.find(a => a.id === activityId);
                if (activity) {
                    if (e.target.dataset.action === 'increment') {
                        activity.progress = Math.min(activity.progress + 1, activity.target || Infinity);
                    } else {
                        activity.progress = Math.max(activity.progress - 1, 0);
                    }
                    
                    if (activity.progress >= activity.target && activity.target > 0) {
                        activity.completed = true;
                        this.celebrate();
                    }
                    
                    this.saveActivities();
                    this.renderDailyView();
                }
            });
        });
    }

    // Verificar progreso de retos
    checkChallengeProgress(activity) {
        this.challenges.forEach(challenge => {
            if (challenge.category === activity.category && 
                challenge.name.toLowerCase().includes(activity.name.toLowerCase())) {
                challenge.progress += activity.progress || 1;
                challenge.streak++;
                this.saveChallenges();
                
                if (challenge.progress >= challenge.target) {
                    this.showNotification(`¡Reto completado! ${challenge.name} 🏆`);
                }
            }
        });
    }

    // Vista de retos
    renderChallengesView() {
        const container = document.getElementById('challenges-container');
        container.innerHTML = this.challenges.map(challenge => `
            <div class="challenge-card">
                <h3>${challenge.name}</h3>
                <p>Progreso: ${challenge.progress} / ${challenge.target} ${challenge.unit}</p>
                <div class="challenge-progress">
                    <div class="challenge-fill" style="width: ${(challenge.progress / challenge.target) * 100}%"></div>
                </div>
                <p>🔥 Racha: ${challenge.streak} días</p>
                <button onclick="app.resetChallenge('${challenge.id}')">Reiniciar Reto</button>
            </div>
        `).join('');
    }

    // Utilidades
    saveActivities() {
        localStorage.setItem('activities', JSON.stringify(this.activities));
    }

    saveChallenges() {
        localStorage.setItem('challenges', JSON.stringify(this.challenges));
    }

    updateProgressBar(activities) {
        if (activities.length === 0) {
            document.getElementById('daily-progress').style.width = '0%';
            return;
        }
        
        const completed = activities.filter(a => a.completed).length;
        const percentage = (completed / activities.length) * 100;
        document.getElementById('daily-progress').style.width = percentage + '%';
    }

    checkDailyReset() {
        const lastReset = localStorage.getItem('lastReset');
        const today = new Date().toDateString();
        
        if (lastReset !== today) {
            this.activities.forEach(activity => {
                activity.completed = false;
                activity.progress = 0;
                activity.date = today;
            });
            this.saveActivities();
            localStorage.setItem('lastReset', today);
        }
    }

    celebrate() {
        const app = document.querySelector('.app-container');
        app.classList.add('celebration');
        setTimeout(() => app.classList.remove('celebration'), 1000);
        
        // Confetti effect
        this.createConfetti();
    }

    createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${['#ff0', '#f0f', '#0ff', '#f00'][Math.floor(Math.random() * 4)]};
                left: ${Math.random() * 100}vw;
                top: -10px;
                z-index: 9999;
                pointer-events: none;
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('LifeRoutine Pro', { body: message });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(perm => {
                if (perm === 'granted') {
                    new Notification('LifeRoutine Pro', { body: message });
                }
            });
        }
    }

    // Funciones globales
    closeModal() {
        document.getElementById('activity-modal').style.display = 'none';
    }

    resetChallenge(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (challenge) {
            challenge.progress = 0;
            challenge.streak = 0;
            this.saveChallenges();
            this.renderChallengesView();
        }
    }
}

// Funciones globales
function addActivity(category) {
    document.getElementById('activity-modal').style.display = 'block';
    document.getElementById('activity-category').value = category;
}

function addSubActivity() {
    const list = document.getElementById('sub-activities-list');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sub-activity-input';
    input.placeholder = 'Nombre del item';
    input.style.cssText = 'width: 100%; padding: 8px; margin: 5px 0;';
    list.appendChild(input);
}

function closeModal() {
    document.getElementById('activity-modal').style.display = 'none';
}

// Inicializar la aplicación
const app = new LifeRoutineApp();

// Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}