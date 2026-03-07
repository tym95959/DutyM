// Floating Dashboard Button Function
function createFloatButton(options = {}) {
    // Default configuration
    const config = {
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        icon: '➕',
        backgroundColor: '#2196F3',
        size: '60px',
        onClick: null,
        dashboardId: 'dashboard-container'
    };

    // Merge user options
    Object.assign(config, options);

    // Create button element
    const floatButton = document.createElement('button');
    floatButton.id = 'float-dashboard-btn';
    floatButton.innerHTML = config.icon;
    floatButton.style.cssText = `
        position: fixed;
        width: ${config.size};
        height: ${config.size};
        border-radius: 50%;
        background-color: ${config.backgroundColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: calc(${config.size} * 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1000;
    `;

    // Set position
    const positions = {
        'bottom-right': { bottom: '30px', right: '30px' },
        'bottom-left': { bottom: '30px', left: '30px' },
        'top-right': { top: '30px', right: '30px' },
        'top-left': { top: '30px', left: '30px' }
    };
    
    Object.assign(floatButton.style, positions[config.position]);

    // Hover effect
    floatButton.onmouseenter = () => {
        floatButton.style.transform = 'scale(1.1)';
        floatButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    };
    
    floatButton.onmouseleave = () => {
        floatButton.style.transform = 'scale(1)';
        floatButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    };

    // Click handler
    floatButton.onclick = (e) => {
        e.preventDefault();
        
        // Toggle dashboard visibility
        toggleDashboard(config.dashboardId);
        
        // Execute custom onClick if provided
        if (typeof config.onClick === 'function') {
            config.onClick(e);
        }
    };

    // Add to document
    document.body.appendChild(floatButton);

    // Create dashboard container if it doesn't exist
    if (!document.getElementById(config.dashboardId)) {
        createDashboard(config.dashboardId);
    }

    return floatButton;
}

// Dashboard toggle function
function toggleDashboard(dashboardId) {
    const dashboard = document.getElementById(dashboardId);
    if (!dashboard) return;

    const isHidden = dashboard.style.display === 'none' || !dashboard.style.display;
    
    if (isHidden) {
        dashboard.style.display = 'block';
        setTimeout(() => {
            dashboard.style.opacity = '1';
            dashboard.style.transform = 'translateY(0)';
        }, 10);
    } else {
        dashboard.style.opacity = '0';
        dashboard.style.transform = 'translateY(20px)';
        setTimeout(() => {
            dashboard.style.display = 'none';
        }, 300);
    }
}

// Create dashboard HTML
function createDashboard(dashboardId) {
    const dashboard = document.createElement('div');
    dashboard.id = dashboardId;
    dashboard.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateY(20px);
        width: 80%;
        max-width: 800px;
        height: 70vh;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        opacity: 0;
        transition: all 0.3s ease;
        display: none;
        z-index: 999;
        overflow: hidden;
    `;

    // Add dashboard content
    dashboard.innerHTML = `
        <div style="padding: 20px; background: #2196F3; color: white;">
            <h2 style="margin: 0;">Dashboard <span style="float: right; cursor: pointer;" onclick="toggleDashboard('${dashboardId}')">✕</span></h2>
        </div>
        <div style="padding: 20px; height: calc(100% - 80px); overflow-y: auto;">
            <h3>Welcome to your dashboard!</h3>
            <p>Here are your stats:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
                    <strong>Total Users</strong>
                    <p style="font-size: 24px; margin: 10px 0;">1,234</p>
                </div>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
                    <strong>Revenue</strong>
                    <p style="font-size: 24px; margin: 10px 0;">$12.5k</p>
                </div>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
                    <strong>Orders</strong>
                    <p style="font-size: 24px; margin: 10px 0;">567</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dashboard);
    
    // Add backdrop click to close
    dashboard.addEventListener('click', (e) => {
        if (e.target === dashboard) {
            toggleDashboard(dashboardId);
        }
    });
}

// Initialize function
function initFloatDashboard() {
    // Create the floating button
    createFloatButton({
        position: 'bottom-right',
        icon: '📊',
        backgroundColor: '#4CAF50',
        size: '65px',
        onClick: () => console.log('Dashboard button clicked!')
    });
}

// Export functions for use in modules (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createFloatButton,
        toggleDashboard,
        createDashboard,
        initFloatDashboard
    };
}
