const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.txt');
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '');
}

// Utility functions
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        const content = users.map(user => JSON.stringify(user)).join('\n');
        fs.writeFileSync(USERS_FILE, content, 'utf-8');
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

// Routes
app.post('/api/register', (req, res) => {
    try {
        const { fullName, username, password, email } = req.body;

        // Validation
        if (!fullName || !username || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        if (fullName.split(' ').length < 2) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên đầy đủ' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        const users = readUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ success: false, message: 'Username đã tồn tại' });
        }

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            fullName,
            username,
            password,
            email: email || '',
            role: 'student',
            avatar: fullName[0].toUpperCase(),
            joinDate: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        res.json({ success: true, message: 'Đăng ký thành công!', user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu username hoặc mật khẩu' });
        }

        const users = readUsers();
        const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

        if (user) {
            res.json({ success: true, message: 'Đăng nhập thành công!', user });
        } else {
            res.status(401).json({ success: false, message: 'Username/Email hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        const publicUsers = users.map(({ password, ...user }) => user);
        res.json({ success: true, users: publicUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Data saved to: ${USERS_FILE}`);
});
