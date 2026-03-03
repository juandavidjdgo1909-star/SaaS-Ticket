document.addEventListener("DOMContentLoaded", () => {
    const API_URL = 'http://localhost:3000/api';
    const subscriptionInfoEl = document.getElementById('subscription-info');
    const plansContainerEl = document.getElementById('plans-container');
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    const searchPlanEl = document.getElementById('searchPlan');
    const sortPlanEl = document.getElementById('sortPlan');
    const confirmModal = document.getElementById('confirmModal');
    const modalBody = document.getElementById('modalBody');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const logoutBtn = document.getElementById('logoutBtn');

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        alert('No has iniciado sesión.');
        window.location.href = 'index.html';
        return;
    }

    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            if (!response.ok) {
                const errText = await response.text();
                const errMessage = errText || `Error al obtener ${endpoint}`;
                if (errMessage.toLowerCase().includes('formato valido')) {
                    alert(errMessage);
                    sessionStorage.removeItem('loggedInUser');
                    window.location.href = 'index.html';
                    return null;
                }
                throw new Error(errMessage);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    };
    const verifyUser = async () => {
        if (!isValidObjectId(loggedInUser._id)) {
            console.warn('ID de usuario inválido:', loggedInUser._id);
            return false;
        }
        try {
            const res = await fetch(`${API_URL}/users/${loggedInUser._id}`);
            if (!res.ok) return false;
            return true;
        } catch {
            return false;
        }
    };

    const renderSubscription = (subscription) => {
        const container = subscriptionInfoEl.querySelector('.subscription-content') || subscriptionInfoEl;
        if (subscription && subscription.data) {
            const sub = subscription.data;
            const now = new Date();
            const end = new Date(sub.fechaFin);
            const msPerDay = 24 * 60 * 60 * 1000;
            const daysRemaining = Math.ceil((end - now) / msPerDay);
            const daysText = daysRemaining > 0 ? `${daysRemaining} día${daysRemaining === 1 ? '' : 's'}` : 'Vencida';
            const daysClass = daysRemaining > 5 ? 'positive' : (daysRemaining > 0 ? 'warning' : 'negative');

            let planName = 'Desconocido';
            if (sub.planId) {
                if (typeof sub.planId === 'string') {
                    planName = `ID: ${sub.planId}`;
                } else {
                    planName = sub.planId.name || sub.planId.nombre || sub.planId.title || planName;
                }
            }
            if (planName === 'Desconocido') {
                console.warn('Suscripción con plan desconocido:', sub.planId);
            }

            const formatDate = d => new Date(d).toLocaleDateString('es-ES', {year:'numeric', month:'numeric', day:'numeric'});

            container.innerHTML = `
                <div class="subscription-row"><label>Plan:</label><span class="value">${planName}</span></div>
                <div class="subscription-row"><label>Estado:</label><span class="value status-${(sub.estado||'').toLowerCase()}">${sub.estado || '—'}</span></div>
                <div class="subscription-row"><label>Vence el:</label><span class="value">${formatDate(end)}</span></div>
                <div class="subscription-row"><label>Días restantes:</label><span class="value days-remaining ${daysClass}">${daysText}</span></div>
                <div class="subscription-row"><label>Contratado el:</label><span class="value">${formatDate(sub.fechaInicio)}</span></div>
            `;
        } else {
            container.innerHTML = '<p>No tienes ninguna suscripción activa. ¡Elige un plan a continuación!</p>';
        }
    };

    let currentPlans = [];
    let currentSubscription = null;
    let selectedPlanId = null;

    const renderPlans = (plans) => {
        plansContainerEl.innerHTML = "";
        currentPlans = plans.data || [];

        if (currentPlans.length === 0) {
            currentPlans = [
                { nombre: 'Basic', precio: 0, descripcion: 'Plan gratuito', caracteristicas: ['1 proyecto'], limiteRecursos: 1, _id: 'basic' },
                { nombre: 'Pro', precio: 29, descripcion: 'Plan intermedio', caracteristicas: ['10 proyectos','Soporte 24/7'], limiteRecursos: 10, _id: 'pro' },
                { nombre: 'Platinum', precio: 79, descripcion: 'Plan completo', caracteristicas: ['Proyectos ilimitados','Soporte VIP'], limiteRecursos: 999, _id: 'platinum' }
            ];
        }

        let currentPlanId = null;
        let currentPlanName = null;
        if (currentSubscription && currentSubscription.data && currentSubscription.data.estado === 'Activa') {
            const pid = currentSubscription.data.planId;
            if (pid) {
                if (typeof pid === 'string') currentPlanId = pid;
                else if (pid._id) currentPlanId = pid._id;
                else currentPlanId = pid;
                if (pid.name || pid.nombre) {
                    currentPlanName = pid.name || pid.nombre;
                }
            }
        }
        const userHasSubscription = currentPlanId != null;

        const canBuyPlan = (planName) => {
            if (!userHasSubscription) return true;
            if (!currentPlanName) return true;
            
            const planTier = { 'Basic': 0, 'Pro': 1, 'Platinum': 2 };
            const currentTier = planTier[currentPlanName];
            const newTier = planTier[planName];
            
            if (currentTier === undefined || newTier === undefined) return true; 
            if (currentTier === 2) return false;
            if (currentTier === 1 && newTier <= 1) return false;
            if (currentTier === 0 && newTier === 0) return false;
            
            return true;
        };

        currentPlans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            const planName = plan.nombre || plan.name || 'Plan';
            const planPrice = (plan.precio ?? plan.price ?? null);
            const planDesc = plan.descripcion || plan.description || '';
            const features = plan.caracteristicas || plan.features || [];
            const limite = plan.limiteRecursos != null ? `Límite: ${plan.limiteRecursos}` : '';

            const isCurrent = userHasSubscription && (plan._id == currentPlanId || plan.id == currentPlanId);
            const canBuy = canBuyPlan(planName);
            const isDisabled = isCurrent || !canBuy;
            
            let buttonLabel = 'Seleccionar Plan';
            if (isCurrent) {
                buttonLabel = 'Ya suscrito';
            } else if (!canBuy) {
                buttonLabel = 'No disponible';
            } else if (userHasSubscription) {
                buttonLabel = 'Actualizar plan';
            }
            
            const disabledAttr = isDisabled ? 'disabled' : '';

            planCard.innerHTML = `
                <div>
                    <h3>${planName}</h3>
                    <p class="price">${planPrice != null ? '$' + planPrice + '/mes' : 'Gratis'}</p>
                    <p class="muted">${planDesc}</p>
                    <ul class="features">
                        ${features.map(f => `<li>• ${f}</li>`).join('')}
                        ${limite ? `<li>• ${limite}</li>` : ''}
                    </ul>
                </div>
                <div style="margin-top:12px;">
                    <button data-id="${plan._id || plan.id}" class="subscribeBtn" ${disabledAttr}>
                        ${buttonLabel}
                    </button>
                </div>
            `;
            plansContainerEl.appendChild(planCard);
        });

        plansContainerEl.querySelectorAll('.subscribeBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectedPlanId = btn.getAttribute('data-id');
                openConfirmModal(selectedPlanId);
            });
        });
    };

    const openConfirmModal = (planId) => {
        const plan = currentPlans.find(p => (p._id === planId) || (p.id === planId));
        if (!plan) return;
        const planName = plan.nombre || plan.name || 'Plan';
        const planPrice = (plan.precio ?? plan.price ?? 0);
        const currentPlanId = currentSubscription && currentSubscription.data &&
            ((currentSubscription.data.planId && (currentSubscription.data.planId._id || currentSubscription.data.planId)) ||
             currentSubscription.data.planId);
        const isUpgrade = currentPlanId && currentPlanId !== planId;
        modalBody.textContent = isUpgrade
            ? `Vas a cambiar tu plan a "${planName}" por $${planPrice}/mes. ¿Deseas continuar?`
            : `Vas a suscribirte a "${planName}" por $${planPrice}/mes. ¿Deseas continuar?`;
        confirmModal.classList.remove('hidden');
    };

    const closeConfirmModal = () => {
        confirmModal.classList.add('hidden');
        selectedPlanId = null;
    };

    window.selectPlan = async (planId) => {
        if (!isValidObjectId(planId)) {
            closeConfirmModal();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioId: loggedInUser._id, planId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al crear la suscripción.');
            alert('¡Suscripción exitosa!');
            closeConfirmModal();
            init();
        } catch (error) {
            const msg = error.message || 'Error inesperado';
            if (msg.toLowerCase().includes('usuario no encontrado')) {
                alert(msg);
                sessionStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            } else {
                if (typeof showNotification === 'function') {
                    showNotification(msg, true);
                } else {
                    alert(msg);
                }
            }
        }
    };
    const init = async () => {
        const exists = await verifyUser();
        if (!exists) {
            alert('Usuario no encontrado en la base de datos. Por favor regístrate o inicia sesión.');
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
            return;
        }

        const [subscription, plansResponse] = await Promise.all([
            fetchData(`subscriptions/${loggedInUser._id}`),
            fetchData('plans')
        ]);
        currentSubscription = subscription;

        let plans = plansResponse;
        if (plans && Array.isArray(plans.data) && plans.data.length === 0) {
            const defaults = [
                { name: 'Basic', price: 0, limiteRecursos: 1 },
                { name: 'Pro', price: 29, limiteRecursos: 10 },
                { name: 'Platinum', price: 79, limiteRecursos: 999 }
            ];
            for (const p of defaults) {
                await fetch(`${API_URL}/plans`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p)
                });
            }
            plans = await fetchData('plans');
        }
        userNameEl.textContent = loggedInUser.nombre || loggedInUser.username || 'Usuario';
        userEmailEl.textContent = loggedInUser.email || '';
        userAvatarEl.textContent = (loggedInUser.nombre || 'U').charAt(0).toUpperCase();

        renderSubscription(subscription);
        if (plans) {
            renderPlans(plans);
        }
    };

    init();

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });

    modalCancel.addEventListener('click', (e) => { e.preventDefault(); closeConfirmModal(); });
    modalConfirm.addEventListener('click', (e) => { e.preventDefault(); if (selectedPlanId) window.selectPlan(selectedPlanId); });

    searchPlanEl.addEventListener('input', () => {
        const q = searchPlanEl.value.toLowerCase().trim();
        const filtered = { data: currentPlans.filter(p => (p.nombre || p.name || '').toLowerCase().includes(q) || (p.descripcion || p.description || '').toLowerCase().includes(q)) };
        renderPlans(filtered);
    });

    sortPlanEl.addEventListener('change', () => {
        const val = sortPlanEl.value;
        let sorted = [...currentPlans];
        if (val === 'price-asc') sorted.sort((a,b)=>(a.precio ?? a.price ?? 0)-(b.precio ?? b.price ?? 0));
        if (val === 'price-desc') sorted.sort((a,b)=>(b.precio ?? b.price ?? 0)-(a.precio ?? a.price ?? 0));
        renderPlans({data: sorted});
    });
    
});