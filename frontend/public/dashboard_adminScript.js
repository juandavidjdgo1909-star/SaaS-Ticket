document.addEventListener("DOMContentLoaded", () => {
    const API_URL = 'http://localhost:3000/api';

    const totalUsersEl = document.getElementById("totalUsers");
    const activeSubsEl = document.getElementById("activeSubs");
    const revenueEl = document.getElementById("revenue");
    const totalPlansEl = document.getElementById("totalPlans");

    const dashboardBody = document.querySelector("#dashboardTable tbody");
    const usersBody = document.querySelector("#usersTable tbody");
    const subsBody = document.querySelector("#subsTable tbody");
    const plansBody = document.querySelector("#plansTable tbody");

    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            if (!response.ok) {
                throw new Error(`Error al obtener datos de ${endpoint}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const renderDashboardTable = (subscriptions) => {
        dashboardBody.innerHTML = "";
        const latestSubs = subscriptions.slice(-5); 
        latestSubs.forEach(sub => {
            const planName = sub.planId?.name || sub.planId?.nombre || 'Desconocido';
            dashboardBody.innerHTML += `
                <tr>
                    <td>${sub.usuarioId.nombre}</td>
                    <td>${planName}</td>
                    <td>${sub.estado}</td>
                    <td>${new Date(sub.fechaInicio).toLocaleDateString()}</td>
                </tr>
            `;
        });
    };

    const renderUsersTable = (users) => {
        usersBody.innerHTML = "";
        users.forEach(user => {
            usersBody.innerHTML += `
                <tr>
                    <td>${user.nombre}</td>
                    <td>${user.email}</td>
                    <td>${new Date(user.fechaRegistro).toLocaleDateString()}</td>
                </tr>
            `;
        });
    };

    const renderSubsTable = (subscriptions) => {
        subsBody.innerHTML = "";
        subscriptions.forEach(sub => {
            const planName = sub.planId?.name || sub.planId?.nombre || 'Desconocido';
            subsBody.innerHTML += `
                <tr>
                    <td>${sub.usuarioId.nombre}</td>
                    <td>${planName}</td>
                    <td>${new Date(sub.fechaInicio).toLocaleDateString()}</td>
                    <td>${new Date(sub.fechaFin).toLocaleDateString()}</td>
                    <td>${sub.estado}</td>
                </tr>
            `;
        });
    };

    const renderPlansTable = (plans) => {
        plansBody.innerHTML = "";
        plans.forEach(plan => {
            const planName = plan.name || plan.nombre || 'Desconocido';
            const planPrice = plan.price || plan.precio || 0;
            const planLimit = plan.limiteRecursos || 'N/A';
            plansBody.innerHTML += `
                <tr>
                    <td>${planName}</td>
                    <td>$${planPrice}/mes</td>
                    <td>30 días</td>
                    <td>Límite: ${planLimit}</td>
                    <td><span style="background: rgb(34, 197, 85); color: white; padding: 4px 8px; border-radius: 4px;">Activo</span></td>
                    <td><button class="btn-edit" data-id="${plan._id}" data-name="${planName}" data-price="${planPrice}" data-limit="${planLimit}">Editar</button></td>
                </tr>
            `;
        });

        // Agregar event listeners a los botones de editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', openEditModal);
        });
    };

    const updateMetrics = (users, subscriptions, plans) => {
        totalUsersEl.textContent = users.length;
        const activeSubs = subscriptions.filter(s => s.estado === 'Activa');
        activeSubsEl.textContent = activeSubs.length;

        const totalRevenue = activeSubs.reduce((sum, sub) => {
            const planPrice = sub.planId?.price || sub.planId?.precio || 0;
            return sum + planPrice;
        }, 0);
        revenueEl.textContent = `$${totalRevenue}`;

        totalPlansEl.textContent = plans.length;
    };

    const init = async () => {
        const [users, subscriptions, plans] = await Promise.all([
            fetchData('users'),
            fetchData('subscriptions'),
            fetchData('plans')
        ]);

        if (users.length > 0) {
            renderUsersTable(users);
        }

        if (subscriptions.length > 0) {
            renderDashboardTable(subscriptions);
            renderSubsTable(subscriptions);
        }

        if (plans.length > 0) {
            renderPlansTable(plans);
        }
        
        updateMetrics(users, subscriptions, plans);
    };

    init();

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    const links = document.querySelectorAll(".sidebar nav a");
    const sections = document.querySelectorAll(".section");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            links.forEach(l => l.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active-section"));

            link.classList.add("active");
            const sectionId = link.getAttribute("data-section");
            document.getElementById(sectionId).classList.add("active-section");
        });
    });

    const editPlanModal = document.getElementById('editPlanModal');
    const editPlanForm = document.getElementById('editPlanForm');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.btn-cancel');
    let allPlans = [];

    const openEditModal = (e) => {
        const btn = e.target;
        const planId = btn.getAttribute('data-id');
        const planName = btn.getAttribute('data-name');
        const planPrice = btn.getAttribute('data-price');
        const planLimit = btn.getAttribute('data-limit');

        document.getElementById('planId').value = planId;
        document.getElementById('planName').value = planName;
        document.getElementById('planPrice').value = planPrice;
        document.getElementById('planLimit').value = planLimit;

        editPlanModal.classList.remove('hidden');
    };

    const closeEditModal = () => {
        editPlanModal.classList.add('hidden');
        editPlanForm.reset();
    };

    closeBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);

    editPlanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const planId = document.getElementById('planId').value;
        const planPrice = parseFloat(document.getElementById('planPrice').value);
        const planLimit = parseInt(document.getElementById('planLimit').value);

        try {
            const response = await fetch(`${API_URL}/plans/${planId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: planPrice, limiteRecursos: planLimit })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el plan');
            }

            alert('Plan actualizado exitosamente');
            closeEditModal();
            init();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
});