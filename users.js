// users.js - Local User Database
// Password hashes are SHA-256 encoded
// To generate new hashes: https://emn178.github.io/online-tools/sha256.html

const users = [
    { 
        username: "Irufan", 
        name: "Abdulla Irufan", 
        passwordHash: "557808176cfefce664c3694042b720e1be6a41974527178598622edc21dc6d9d", 
        Level: "Supervisor",  
        RCNo: "979",
        email: "iru@example.com",
        department: "Management",
        phone: "+971501234567",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "staff001", 
        name: "John Smith", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Staff",  
        RCNo: "001",
        email: "john@example.com",
        department: "Operations",
        phone: "+971501234568",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "staff002", 
        name: "Sarah Johnson", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Staff",  
        RCNo: "002",
        email: "sarah@example.com",
        department: "Operations",
        phone: "+971501234569",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "manager001", 
        name: "Robert Wilson", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Manager",  
        RCNo: "003",
        email: "robert@example.com",
        department: "Management",
        phone: "+971501234570",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "viewer001", 
        name: "Emma Davis", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Viewer",  
        RCNo: "999",
        email: "emma@example.com",
        department: "Reception",
        phone: "+971501234571",
        slBalance: 0,
        frlBalance: 0,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "ahmed", 
        name: "Ahmed Hassan", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Staff",  
        RCNo: "004",
        email: "ahmed@example.com",
        department: "Maintenance",
        phone: "+971501234572",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    },
    { 
        username: "fatima", 
        name: "Fatima Ali", 
        passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
        Level: "Staff",  
        RCNo: "005",
        email: "fatima@example.com",
        department: "HR",
        phone: "+971501234573",
        slBalance: 30,
        frlBalance: 15,
        status: "active",
        createdDate: "2024-01-01"
    }
];

// Function to get user by username
function getUserByUsername(username) {
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

// Function to get user by RC number
function getUserByRC(rcNumber) {
    return users.find(user => user.RCNo === rcNumber);
}

// Function to get all staff users
function getAllStaff() {
    return users.filter(user => user.Level === "Staff" || user.Level === "Supervisor" || user.Level === "Manager");
}

// Function to get all active users
function getActiveUsers() {
    return users.filter(user => user.status === "active");
}

// Function to update user data
function updateUser(rcNumber, updates) {
    const index = users.findIndex(user => user.RCNo === rcNumber);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        return true;
    }
    return false;
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        users,
        getUserByUsername,
        getUserByRC,
        getAllStaff,
        getActiveUsers,
        updateUser
    };
}
