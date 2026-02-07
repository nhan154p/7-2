// ============== CONFIGURATION ==============
const API_URL = 'http://localhost:3000';
const CACHE_KEYS = {
    ACTIVITIES: 'lop72_activities',
    MESSAGES: 'lop72_messages',
    CURRENT_USER: 'lop72_current_user'
};

// ============== STORAGE UTILITIES ==============
class LocalCache {
    static get(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || 'null');
        } catch { return null; }
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static getActivities() {
        return this.get(CACHE_KEYS.ACTIVITIES) || [];
    }

    static setActivities(data) {
        this.set(CACHE_KEYS.ACTIVITIES, data);
    }

    static getMessages() {
        return this.get(CACHE_KEYS.MESSAGES) || [];
    }

    static setMessages(data) {
        this.set(CACHE_KEYS.MESSAGES, data);
    }

    static getCurrentUser() {
        return this.get(CACHE_KEYS.CURRENT_USER);
    }

    static setCurrentUser(user) {
        this.set(CACHE_KEYS.CURRENT_USER, user);
    }

    static clearCurrentUser() {
        this.remove(CACHE_KEYS.CURRENT_USER);
    }
}

// ============== API UTILITIES ==============
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Lỗi kết nối server' };
    }
}

// ============== PAGE MANAGEMENT ==============
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function switchSection(sectionId) {
    const currentUser = LocalCache.getCurrentUser();
    if (!currentUser && sectionId !== 'home') {
        alert('Vui lòng đăng nhập');
        return;
    }

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });

    // Load content for section
    switch(sectionId) {
        case 'members': loadMembers(); break;
        case 'activities': loadActivities(); break;
        case 'chat': loadMessages(); break;
        case 'profile': loadProfile(); break;
    }
}

// ============== MODAL MANAGEMENT ==============
function openActivityModal() {
    const currentUser = LocalCache.getCurrentUser();
    if (!currentUser) {
        alert('Vui lòng đăng nhập để đăng bài');
        return;
    }
    document.getElementById('activityModal').style.display = 'block';
}

function closeActivityModal() {
    document.getElementById('activityModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = event.target;
    if (modal.id === 'activityModal') {
        modal.style.display = 'none';
    }
}

// ============== AUTHENTICATION ==============
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value.trim();

    const result = await apiCall('/api/register', 'POST', {
        fullName, username, password, email
    });

    if (result.success) {
        alert(result.message);
        document.getElementById('registerForm').reset();
        switchPage('loginPage');
    } else {
        alert(result.message);
    }
});

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const result = await apiCall('/api/login', 'POST', { username, password });

    if (result.success) {
        LocalCache.setCurrentUser(result.user);
        document.getElementById('loginForm').reset();
        updateAuthUI();
        switchPage('hubPage');
        loadInitialData();
    } else {
        alert(result.message);
    }
});

function logout() {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
        LocalCache.clearCurrentUser();
        updateAuthUI();
        switchPage('loginPage');
    }
}

function updateAuthUI() {
    const currentUser = LocalCache.getCurrentUser();
    const userGreeting = document.getElementById('userGreeting');
    
    if (currentUser && userGreeting) {
        userGreeting.textContent = currentUser.fullName.split(' ').pop();
    }
}

// ============== MEMBERS ==============
let allUsers = [];

async function loadMembers() {
    const result = await apiCall('/api/users');
    if (result.success) {
        allUsers = result.users;
        renderMembers(allUsers);
    }
}

function renderMembers(users) {
    const membersGrid = document.getElementById('membersGrid');
    membersGrid.innerHTML = users.length ? '' : '<p class="loading">Chưa có thành viên</p>';

    users.forEach(user => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.innerHTML = `
            <div class="member-avatar">${user.avatar}</div>
            <div class="member-name">${user.fullName}</div>
            <div class="member-username">@${user.username}</div>
            <div class="member-status">Online</div>
        `;
        membersGrid.appendChild(memberCard);
    });
}

function searchMembers() {
    const searchTerm = document.getElementById('searchMembers').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.fullName.toLowerCase().includes(searchTerm) || 
        u.username.toLowerCase().includes(searchTerm)
    );
    renderMembers(filtered);
}

// ============== IMAGE UTILITIES ==============
function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// ============== ACTIVITIES ==============
async function submitActivity(e) {
    e.preventDefault();
    const currentUser = LocalCache.getCurrentUser();
    if (!currentUser) return;

    const title = document.getElementById('activityTitle').value.trim();
    const content = document.getElementById('activityContent').value.trim();
    const type = document.getElementById('activityType').value;
    const imageInput = document.getElementById('activityImage');

    if (!title || !content) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        imageData = await fileToBase64(imageInput.files[0]);
    }

    const activity = {
        id: Date.now().toString(),
        userId: currentUser.id,
        author: currentUser.fullName,
        avatar: currentUser.avatar,
        type,
        title,
        content,
        image: imageData,
        date: new Date().toISOString(),
        likes: [],
        comments: []
    };

    const activities = LocalCache.getActivities();
    activities.unshift(activity);
    LocalCache.setActivities(activities);

    alert('Đăng bài thành công!');
    closeActivityModal();
    document.getElementById('activityForm').reset();
    document.getElementById('activityImagePreview').style.display = 'none';
    loadActivities();
}

function loadActivities() {
    const activities = LocalCache.getActivities();
    const feed = document.getElementById('activitiesFeed');
    feed.innerHTML = activities.length ? '' : '<p class="loading">Chưa có hoạt động</p>';

    activities.forEach(activity => {
        const date = new Date(activity.date).toLocaleDateString('vi-VN');
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let imageHTML = '';
        if (activity.image) {
            imageHTML = `<img src="${activity.image}" alt="Activity image" class="activity-image">`;
        }
        
        activityItem.innerHTML = `
            <div class="activity-header">
                <div class="activity-avatar">${activity.avatar}</div>
                <div class="activity-info">
                    <div class="activity-author">${activity.author}</div>
                    <div class="activity-time">${date}</div>
                </div>
            </div>
            <span class="activity-type">${activity.type}</span>
            <div class="activity-title">${activity.title}</div>
            <div class="activity-content">${activity.content}</div>
            ${imageHTML}
            <div class="activity-actions">
                <button class="activity-action like-btn" data-id="${activity.id}">
                    <i class="fas fa-heart"></i> <span>${activity.likes.length}</span>
                </button>
                <button class="activity-action">
                    <i class="fas fa-comment"></i> <span>${activity.comments.length}</span>
                </button>
                <button class="activity-action">
                    <i class="fas fa-share"></i> <span>Chia sẻ</span>
                </button>
            </div>
        `;
        feed.appendChild(activityItem);
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const currentUser = LocalCache.getCurrentUser();
            if (!currentUser) return alert('Vui lòng đăng nhập');

            const activityId = this.dataset.id;
            const activities = LocalCache.getActivities();
            const activity = activities.find(a => a.id === activityId);
            
            if (activity.likes.includes(currentUser.id)) {
                activity.likes = activity.likes.filter(id => id !== currentUser.id);
            } else {
                activity.likes.push(currentUser.id);
            }

            LocalCache.setActivities(activities);
            loadActivities();
        });
    });
}

// ============== CHAT ==============
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    const currentUser = LocalCache.getCurrentUser();
    const imageInput = document.getElementById('chatImageInput');

    if (!currentUser) {
        alert('Vui lòng đăng nhập để chat');
        return;
    }

    if (!text && (!imageInput.files || !imageInput.files[0])) return;

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        imageData = await fileToBase64(imageInput.files[0]);
    }

    const message = {
        id: Date.now().toString(),
        userId: currentUser.id,
        author: currentUser.fullName,
        text,
        image: imageData,
        date: new Date().toISOString()
    };

    const messages = LocalCache.getMessages();
    messages.push(message);
    LocalCache.setMessages(messages);

    input.value = '';
    imageInput.value = '';
    document.getElementById('imagePreview').style.display = 'none';
    loadMessages();
}

function loadMessages() {
    const messages = LocalCache.getMessages();
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = messages.length ? '' : '<p class="loading">Chưa có tin nhắn</p>';

    messages.forEach(msg => {
        const currentUser = LocalCache.getCurrentUser();
        const isOwn = currentUser && msg.userId === currentUser.id;
        const time = new Date(msg.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : ''}`;
        
        let imageHTML = '';
        if (msg.image) {
            imageHTML = `<img src="${msg.image}" alt="Chat image" class="message-image">`;
        }
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-author">${msg.author}</div>
                ${msg.text ? `<div class="message-text">${msg.text}</div>` : ''}
                ${imageHTML}
                <div class="message-time">${time}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============== PROFILE ==============
function loadProfile() {
    const currentUser = LocalCache.getCurrentUser();
    const profileCard = document.getElementById('profileCard');
    
    if (!currentUser) {
        profileCard.innerHTML = '<p class="loading">Vui lòng đăng nhập</p>';
        return;
    }

    const joinDate = new Date(currentUser.joinDate).toLocaleDateString('vi-VN');
    profileCard.innerHTML = `
        <div class="profile-content">
            <div class="profile-avatar-large">${currentUser.avatar}</div>
            <div class="profile-info">
                <h3>${currentUser.fullName}</h3>
                <p class="profile-username">@${currentUser.username}</p>
                ${currentUser.email ? `<p class="profile-email"><i class="fas fa-envelope"></i> ${currentUser.email}</p>` : ''}
                <p class="profile-joined"><i class="fas fa-calendar"></i> Tham gia ngày ${joinDate}</p>
            </div>
        </div>
    `;
}

// ============== UTILITIES ==============
function clearImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const chatImageInput = document.getElementById('chatImageInput');
    
    imagePreview.style.display = 'none';
    previewImg.src = '';
    chatImageInput.value = '';
}

function loadInitialData() {
    loadMembers();
    loadActivities();
    loadMessages();
    updateAuthUI();
}

// ============== EVENT LISTENERS ==============
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = LocalCache.getCurrentUser();
    if (currentUser) {
        switchPage('hubPage');
        loadInitialData();
    }

    // Message input Enter key
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Activity image preview
    const activityImageInput = document.getElementById('activityImage');
    if (activityImageInput) {
        activityImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('activityImagePreview');
                    const img = document.getElementById('activityPreviewImg');
                    img.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Chat image preview
    const chatImageInput = document.getElementById('chatImageInput');
    if (chatImageInput) {
        chatImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('imagePreview');
                    const img = document.getElementById('previewImg');
                    img.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                document.getElementById('navMenu').classList.remove('active');
            });
        });
    }

    // Particles animation
    initializeParticles();
});

// ============== PARTICLES ==============
function initializeParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        container.appendChild(particle);
    }
}