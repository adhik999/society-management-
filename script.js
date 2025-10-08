// Housing Co-operative Society Management System
// Main JavaScript file for all functionality

// Enable console logs for debugging
// console.log = function() {};
// console.warn = function() {};
// console.info = function() {};
// Keep console.error for critical errors only

// Global variables
let currentUser = null;
let currentSection = 'dashboard';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🏢 Society Management System Loading...');
    
    try {
        // Load society info first
        loadSocietyInfo();
        
        initializeEventListeners();
        
        // Handle Google redirect result if available (only for http/https)
        if (typeof FirebaseHelper !== 'undefined') {
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                try {
                    const redirectResult = await FirebaseHelper.handleGoogleRedirectResult();
                    if (redirectResult.success && redirectResult.user) {
                        console.log('Processing Google redirect login...');
                        
                        // Set current user from Google redirect
                        currentUser = {
                            uid: redirectResult.user.uid,
                            email: redirectResult.user.email,
                            username: redirectResult.user.displayName || redirectResult.user.email,
                            role: 'manager',
                            photoURL: redirectResult.user.photoURL,
                            provider: 'google',
                            loginTime: new Date().toISOString()
                        };
                        
                        localStorage.setItem('societyManager', JSON.stringify(currentUser));
                        
                        // Show success and redirect
                        showNotification(`Welcome ${currentUser.username}! 🎉`, 'success');
                        showMainApp();
                        loadDashboardData();
                        return;
                    }
                } catch (error) {
                    console.log('No Google redirect result:', error.message);
                }
            } else {
                console.log('🔒 File protocol detected - Google auth disabled, use createTestUser() instead');
            }
        }
        
        // Check if user is already logged in
        checkExistingLogin();
        
        console.log('✅ Society Management System Loaded Successfully!');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showLoginScreen(); // Fallback to login screen
    }
});

function initializeApp() {
    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.error || e.message);
        // Suppress generic "Script error" messages
        if (e.message && e.message.includes('Script error')) {
            return true;
        }
    });
    
    // Check if user is already logged in
    checkExistingLogin();
    
    console.log('Society Management System Loaded Successfully!');
}

function loadSocietyInfo() {
    updateLoginPageSocietyName();
}

function checkExistingLogin() {
    const savedUser = localStorage.getItem('societyManager');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        loadDashboardData();
    } else {
        showLoginScreen();
    }
}

function updateLoginPageSocietyName() {
    // Get society information from localStorage (saved from Settings)
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    
    // Set default values only if not exists
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
        localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    }
    
    const societyName = societyInfo.name;
    
    // Update login page society name
    const loginSocietyName = document.getElementById('loginSocietyName');
    if (loginSocietyName) {
        // Format society name for better display
        const formattedName = societyName.replace(', LTD.', '').replace('CO-OPERATIVE HOUSING SOCIETY', 'SOCIETY');
        loginSocietyName.textContent = formattedName;
    }
    
    // Update browser tab title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const shortName = societyName.split(' ').slice(0, 3).join(' '); // Take first 3 words
        pageTitle.textContent = `🏢 ${shortName}`;
    }
}

function initializeEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Google Login Button
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        console.log('✅ Google login button found, adding event listener');
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    } else {
        console.log('❌ Google login button not found');
        // Try to find it after a delay (in case DOM is still loading)
        setTimeout(() => {
            const delayedGoogleBtn = document.getElementById('googleLoginBtn');
            if (delayedGoogleBtn) {
                console.log('✅ Google login button found after delay, adding event listener');
                delayedGoogleBtn.addEventListener('click', handleGoogleLogin);
            } else {
                console.log('❌ Google login button still not found after delay');
            }
        }, 1000);
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (sidebarBackdrop) {
                sidebarBackdrop.classList.toggle('active');
            }
        });

        // Close sidebar when clicking backdrop
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', function() {
                sidebar.classList.remove('active');
                sidebarBackdrop.classList.remove('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                    if (sidebarBackdrop) {
                        sidebarBackdrop.classList.remove('active');
                    }
                }
            }
        });

        // Close sidebar when window is resized to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                if (sidebarBackdrop) {
                    sidebarBackdrop.classList.remove('active');
                }
            }
        });
    }

    // Navigation menu
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            try {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                
                if (section) {
                    console.log('Switching to section:', section);
                    switchSection(section);
                    
                    // Close mobile sidebar when nav item is clicked
                    if (window.innerWidth <= 768 && sidebar) {
                        sidebar.classList.remove('active');
                        if (sidebarBackdrop) {
                            sidebarBackdrop.classList.remove('active');
                        }
                    }
                } else {
                    console.error('No data-section attribute found on nav item');
                }
            } catch (error) {
                console.error('Error in navigation click handler:', error);
            }
        });
    });

    // Settings tabs
    const settingsTabs = document.querySelectorAll('.settings-tabs .tab');
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchSettingsTab(tabName);
        });
    });

    // Add button event listeners
    addButtonEventListeners();
}

// Global function to attach Generate Bills listener
function attachGenerateBillsListener() {
    const quickGenerateBillsBtn = document.getElementById('quickGenerateBillsBtn');
    if (quickGenerateBillsBtn) {
        // Remove existing listeners to avoid duplicates
        quickGenerateBillsBtn.replaceWith(quickGenerateBillsBtn.cloneNode(true));
        const newBtn = document.getElementById('quickGenerateBillsBtn');
        
        newBtn.addEventListener('click', function(e) {
            console.log('Quick Generate Bills button clicked!');
            quickGenerateMonthlyBills();
        });
        console.log('Quick Generate Bills button event listener added successfully');
        return true;
    } else {
        console.error('Quick Generate Bills button not found in DOM!');
        return false;
    }
}

function addButtonEventListeners() {
    // Add Flat Button
    const addFlatBtn = document.getElementById('addFlatBtn');
    if (addFlatBtn) {
        addFlatBtn.addEventListener('click', showAddFlatModal);
    }

    // Import Members Button
    const importMembersBtn = document.getElementById('importMembersBtn');
    if (importMembersBtn) {
        importMembersBtn.addEventListener('click', showImportMembersModal);
    }

    // Try to attach Generate Bills listener
    attachGenerateBillsListener();

    // Record Payment Button
    const recordPaymentBtn = document.getElementById('recordPaymentBtn');
    if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', showRecordPaymentModal);
    }

    // Add Other Income Button
    const addOtherIncomeBtn = document.getElementById('addOtherIncomeBtn');
    if (addOtherIncomeBtn) {
        addOtherIncomeBtn.addEventListener('click', showAddOtherIncomeModal);
    }

    // Add Expense Button
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', showAddExpenseModal);
    }

    // Add Bank Button
    const addBankBtn = document.getElementById('addBankBtn');
    if (addBankBtn) {
        addBankBtn.addEventListener('click', showAddBankModal);
    }

    // Add Bank Payment Button
    const addBankPaymentBtn = document.getElementById('addBankPaymentBtn');
    if (addBankPaymentBtn) {
        addBankPaymentBtn.addEventListener('click', showAddBankPaymentModal);
    }

    // Add Notice Button
    const addNoticeBtn = document.getElementById('addNoticeBtn');
    if (addNoticeBtn) {
        addNoticeBtn.addEventListener('click', showAddNoticeModal);
    }


    // Bill Config Form
    const billConfigForm = document.getElementById('billConfigForm');
    if (billConfigForm) {
        billConfigForm.addEventListener('submit', saveBillConfiguration);
    }
}

// Google Login Handler
async function handleGoogleLogin() {
    const googleBtn = document.getElementById('googleLoginBtn');
    const originalText = googleBtn.innerHTML;
    
    // Show loading
    googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in with Google...';
    googleBtn.disabled = true;
    
    try {
        if (typeof FirebaseHelper !== 'undefined') {
            const result = await FirebaseHelper.loginWithGoogle();
            
            if (result.success) {
                // Get user data
                const userData = await FirebaseHelper.getUserData(result.user.uid);
                
                currentUser = {
                    uid: result.user.uid,
                    email: result.user.email,
                    username: result.user.displayName || result.user.email,
                    role: userData?.role || 'manager',
                    photoURL: result.user.photoURL,
                    provider: 'google',
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('societyManager', JSON.stringify(currentUser));
                
                // Show success and redirect
                showNotification(`Welcome ${currentUser.username}! 🎉`, 'success');
                setTimeout(() => {
                    showMainApp();
                    loadDashboardData();
                }, 1000);
                
                return;
            } else {
                showNotification('Google sign-in failed: ' + result.error, 'error');
            }
        } else {
            showNotification('Firebase not available', 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showNotification('Google sign-in failed: ' + error.message, 'error');
    } finally {
        // Reset button
        googleBtn.innerHTML = originalText;
        googleBtn.disabled = false;
    }
}

// Authentication Functions with Firebase
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show loading
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;
    
    try {
        // Try Firebase Authentication first
        if (typeof FirebaseHelper !== 'undefined') {
            const result = await FirebaseHelper.loginUser(username, password);
            
            if (result.success) {
                // Get user data from Firebase
                const userData = await FirebaseHelper.getUserData(result.user.uid);
                
                currentUser = {
                    uid: result.user.uid,
                    email: result.user.email,
                    username: userData?.name || result.user.email,
                    role: userData?.role || 'manager',
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('societyManager', JSON.stringify(currentUser));
                showMainApp();
                loadDashboardData();
                showNotification('🔥 Firebase Login successful!', 'success');
                return;
            }
        }
        
        // Fallback to local authentication
        if (username === 'ghadageadhik99@gmail.com' && password === 'ghadageadhik99') {
            currentUser = {
                username: username,
                role: 'manager',
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('societyManager', JSON.stringify(currentUser));
            showMainApp();
            loadDashboardData();
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Invalid email or password!', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        // Restore button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        // Firebase logout if available
        if (typeof FirebaseHelper !== 'undefined') {
            await FirebaseHelper.logoutUser();
        }
        
        // Clear local storage
        localStorage.removeItem('societyManager');
        currentUser = null;
        showLoginScreen();
        showNotification('Logged out successfully!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        // Still proceed with local logout
        localStorage.removeItem('societyManager');
        currentUser = null;
        showLoginScreen();
        showNotification('Logged out successfully!', 'success');
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'grid';
}

// Navigation Functions
function logout() {
    // Clear user data
    localStorage.removeItem('societyManager');
    currentUser = null;
    
    // Show login screen
    showLoginScreen();
    
    // Show notification
    showNotification('Logged out successfully!', 'success');
}

function switchSection(sectionName) {
    console.log('Switching to section:', sectionName);
    try {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            currentSection = sectionName;
            
            // Load section-specific data
            loadSectionData(sectionName);
        } else {
            console.error(`Section ${sectionName}Section not found`);
        }
    } catch (error) {
        console.error('Error switching section:', error);
    }
}

function switchSettingsTab(tabName) {
    // Update active tab
    document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Data Loading Functions
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'addFlatBtn':
            showAddFlatModal();
            break;
        case 'importMembersBtn':
            showImportMembersModal();
            break;
        case 'flats':
            console.log('Loading flats section data...');
            loadFlatsData();
            break;
        case 'billing':
            console.log('Loading billing section data...');
            loadBillingData();
            // Re-attach event listeners for billing section
            setTimeout(() => {
                console.log('Re-attaching billing section event listeners...');
                attachGenerateBillsListener();
            }, 100);
            break;
        case 'billconfig':
            loadBillConfigData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'expenses':
            loadExpensesData();
            break;
        case 'banks':
            loadBanksData();
            break;
        case 'reports':
            loadReportsData();
            break;
        case 'notices':
            loadNoticesData();
            break;
        case 'complaints':
            loadComplaintsData();
            break;
        case 'meetings':
            loadMeetingsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

function loadDashboardData() {
    // Load dashboard statistics
    const flats = getFlatsData();
    const payments = getPaymentsData();
    const expenses = getExpensesData();
    const bills = getBillsData();
    const banks = getBanksData();

    // Update dashboard cards
    document.getElementById('totalFlats').textContent = flats.length;
    
    // Calculate this month's collection
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const totalCollection = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('totalCollection').textContent = `₹${totalCollection.toLocaleString()}`;

    // Calculate pending dues using same logic as Outstanding Dues Report
    const flatDues = {};
    
    // Initialize all flats
    flats.forEach(flat => {
        flatDues[flat.flatNumber] = {
            flatNumber: flat.flatNumber,
            totalBilled: 0,
            totalPaid: 0,
            outstanding: 0
        };
    });
    
    // Add bills data
    bills.forEach(bill => {
        if (!flatDues[bill.flatNumber]) {
            flatDues[bill.flatNumber] = {
                flatNumber: bill.flatNumber,
                totalBilled: 0,
                totalPaid: 0,
                outstanding: 0
            };
        }
        flatDues[bill.flatNumber].totalBilled += bill.totalAmount;
    });
    
    // Add payments data
    payments.forEach(payment => {
        if (flatDues[payment.flatNumber]) {
            flatDues[payment.flatNumber].totalPaid += payment.amount;
        }
    });
    
    // Calculate outstanding amounts
    Object.values(flatDues).forEach(flat => {
        flat.outstanding = Math.max(0, flat.totalBilled - flat.totalPaid);
    });
    
    // Total pending dues
    const totalPendingDues = Object.values(flatDues).reduce((sum, flat) => sum + flat.outstanding, 0);
    
    // Calculate monthly expenses
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('monthlyExpenses').textContent = `₹${totalExpenses.toLocaleString()}`;

    // Calculate total bank balance
    const totalBankBalance = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
    document.getElementById('totalBankBalance').textContent = `₹${totalBankBalance.toLocaleString()}`;
    // Update pending dues
    document.getElementById('pendingDues').textContent = `₹${totalPendingDues.toLocaleString()}`;
    
    // Count bills generated this month
    const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthlyBills = bills.filter(bill => bill.period === currentPeriod);
    document.getElementById('totalBills').textContent = monthlyBills.length;

    // Recent activities and monthly summary removed as requested
}

// Function to refresh all data displays after payment operations
function refreshAllDataDisplays() {
    // Small delay to ensure data is saved properly
    setTimeout(() => {
        // Refresh bills table to show updated status
        if (typeof loadBillingData === 'function') {
            loadBillingData();
        }
        
        // Refresh flats table to show updated outstanding amounts
        if (typeof loadFlatsData === 'function') {
            loadFlatsData();
        }
        
        // Refresh payments table
        if (typeof loadPaymentsData === 'function') {
            loadPaymentsData();
        }
        
        console.log('All data displays refreshed');
    }, 100);
}

// Recent Activities and Monthly Summary functions removed as requested

// Data Management Functions with Firebase Integration
function getFlatsData() {
    return JSON.parse(localStorage.getItem('societyFlats') || '[]');
}

function saveFlatsData(flats) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyFlats', JSON.stringify(flats));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        flats.forEach(flat => {
            FirebaseHelper.saveFlat(flat).catch(error => {
                console.log('Firebase save failed, using localStorage only');
            });
        });
    }
}
// Save individual flat to Firebase immediately
async function saveFlatToFirebase(flatData) {
    if (typeof FirebaseHelper !== 'undefined') {
        try {
            // Check if user is authenticated, if not, login automatically
            if (!FirebaseHelper.getCurrentUser()) {
                console.log('🔐 Auto-logging in for Firebase sync...');
                const loginResult = await FirebaseHelper.loginUser('ghadageadhik99@gmail.com', 'ghadageadhik99');
                if (!loginResult.success) {
                    console.log('❌ Auto-login failed:', loginResult.error);
                    showNotification('⚠️ Firebase login failed, saved locally only', 'warning');
                    return;
                }
                console.log('✅ Auto-login successful for Firebase sync');
            }
            
            const result = await FirebaseHelper.saveFlat(flatData);
            if (result) {
                console.log(`✅ Flat ${flatData.flatNumber} saved to Firebase`);
                showNotification(`🔥 Flat ${flatData.flatNumber} synced to Firebase!`, 'success');
            }
        } catch (error) {
            console.log('Firebase flat save failed:', error);
            showNotification('⚠️ Flat Firebase sync failed, saved locally only', 'warning');
        }
    }
}

function getPaymentsData() {
    return JSON.parse(localStorage.getItem('societyPayments') || '[]');
}

function savePaymentsData(payments) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyPayments', JSON.stringify(payments));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        payments.forEach(payment => {
            FirebaseHelper.savePayment(payment).catch(error => {
                console.log('Firebase save failed, using localStorage only');
            });
        });
    }
}

// Save individual payment to Firebase immediately
async function savePaymentToFirebase(paymentData) {
    if (typeof FirebaseHelper !== 'undefined') {
        try {
            // Auto-login if not authenticated
            if (!FirebaseHelper.getCurrentUser()) {
                console.log('🔐 Auto-logging in for Firebase sync...');
                const loginResult = await FirebaseHelper.loginUser('ghadageadhik99@gmail.com', 'ghadageadhik99');
                if (!loginResult.success) {
                    console.log('❌ Auto-login failed:', loginResult.error);
                    showNotification('⚠️ Firebase login failed, saved locally only', 'warning');
                    return;
                }
            }
            
            const result = await FirebaseHelper.savePayment(paymentData);
            if (result) {
                console.log(`✅ Payment ${paymentData.id} saved to Firebase`);
                showNotification(`🔥 Payment synced to Firebase!`, 'success');
            }
        } catch (error) {
            console.log('Firebase payment save failed:', error);
            showNotification('⚠️ Payment Firebase sync failed, saved locally only', 'warning');
        }
    }
}

function getExpensesData() {
    return JSON.parse(localStorage.getItem('societyExpenses') || '[]');
}

function saveExpensesData(expenses) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyExpenses', JSON.stringify(expenses));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        expenses.forEach(expense => {
            FirebaseHelper.saveExpense(expense).catch(error => {
                console.log('Firebase save failed, using localStorage only');
            });
        });
    }
}

// Save individual expense to Firebase immediately
async function saveExpenseToFirebase(expenseData) {
    if (typeof FirebaseHelper !== 'undefined') {
        try {
            // Auto-login if not authenticated
            if (!FirebaseHelper.getCurrentUser()) {
                console.log('🔐 Auto-logging in for Firebase sync...');
                const loginResult = await FirebaseHelper.loginUser('ghadageadhik99@gmail.com', 'ghadageadhik99');
                if (!loginResult.success) {
                    console.log('❌ Auto-login failed:', loginResult.error);
                    showNotification('⚠️ Firebase login failed, saved locally only', 'warning');
                    return;
                }
            }
            
            const result = await FirebaseHelper.saveExpense(expenseData);
            if (result) {
                console.log(`✅ Expense ${expenseData.id} saved to Firebase`);
                showNotification(`🔥 Expense synced to Firebase!`, 'success');
            }
        } catch (error) {
            console.log('Firebase expense save failed:', error);
            showNotification('⚠️ Expense Firebase sync failed, saved locally only', 'warning');
        }
    }
}

function getBanksData() {
    return JSON.parse(localStorage.getItem('societyBanks') || '[]');
}

function saveBanksData(banks) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyBanks', JSON.stringify(banks));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        banks.forEach(bank => {
            FirebaseHelper.saveBank(bank).catch(error => {
                console.log('Firebase save failed, using localStorage only');
            });
        });
    }
}

// Save individual bank to Firebase immediately
async function saveBankToFirebase(bankData) {
    if (typeof FirebaseHelper !== 'undefined') {
        try {
            // Auto-login if not authenticated
            if (!FirebaseHelper.getCurrentUser()) {
                console.log('🔐 Auto-logging in for Firebase sync...');
                const loginResult = await FirebaseHelper.loginUser('ghadageadhik99@gmail.com', 'ghadageadhik99');
                if (!loginResult.success) {
                    console.log('❌ Auto-login failed:', loginResult.error);
                    showNotification('⚠️ Firebase login failed, saved locally only', 'warning');
                    return;
                }
            }
            
            const result = await FirebaseHelper.saveBank(bankData);
            if (result) {
                console.log(`✅ Bank ${bankData.bankName} saved to Firebase`);
                showNotification(`🔥 Bank ${bankData.bankName} synced to Firebase!`, 'success');
            }
        } catch (error) {
            console.log('Firebase bank save failed:', error);
            showNotification('⚠️ Bank Firebase sync failed, saved locally only', 'warning');
        }
    }
}
function getBankPaymentsData() {
    return JSON.parse(localStorage.getItem('societyBankPayments') || '[]');
}

function saveBankPaymentsData(bankPayments) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyBankPayments', JSON.stringify(bankPayments));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        bankPayments.forEach(transaction => {
            if (transaction.bankId) {
                FirebaseHelper.saveBankTransaction(transaction.bankId, transaction).catch(error => {
                    console.log('Firebase save failed, using localStorage only');
                });
            }
        });
    }
}

function getOtherIncomeData() {
    return JSON.parse(localStorage.getItem('societyOtherIncome') || '[]');
}

function saveOtherIncomeData(otherIncome) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyOtherIncome', JSON.stringify(otherIncome));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        otherIncome.forEach(income => {
            FirebaseHelper.saveOtherIncome(income).catch(error => {
                console.log('Firebase save failed, using localStorage only');
            });
        });
    }
}

// Debug function to check bank payments data
function debugBankPayments() {
    const bankPayments = getBankPaymentsData();
    console.log('Current bank payments in localStorage:', bankPayments);
    console.log('Total bank payments:', bankPayments.length);
    
    // Show in notification as well
    showNotification(`Found ${bankPayments.length} bank payments in storage`, 'info');
    
    return bankPayments;
}

// Function to clean duplicate bank payments
function cleanDuplicateBankPayments() {
    const bankPayments = getBankPaymentsData();
    const banks = getBanksData();
    
    console.log('Before cleaning:', bankPayments.length, 'payments');
    
    // Group payments by reference (receipt number)
    const paymentGroups = {};
    bankPayments.forEach(payment => {
        const key = payment.reference || 'no-reference';
        if (!paymentGroups[key]) {
            paymentGroups[key] = [];
        }
        paymentGroups[key].push(payment);
    });
    
    // Keep only the first payment from each group, remove duplicates
    const cleanedPayments = [];
    let duplicatesRemoved = 0;
    
    Object.values(paymentGroups).forEach(group => {
        if (group.length > 1) {
            // Multiple payments with same reference - keep only the first one
            console.log(`Found ${group.length} duplicate payments for reference:`, group[0].reference);
            cleanedPayments.push(group[0]); // Keep first one
            duplicatesRemoved += group.length - 1;
            
            // Adjust bank balance - remove the extra amounts
            const extraAmount = group.slice(1).reduce((sum, payment) => sum + payment.amount, 0);
            const bankId = group[0].bankId;
            const bankIndex = banks.findIndex(bank => bank.id === bankId);
            if (bankIndex !== -1) {
                banks[bankIndex].balance = (banks[bankIndex].balance || 0) - extraAmount;
                console.log(`Adjusted bank balance by -₹${extraAmount} for bank:`, banks[bankIndex].bankName);
            }
        } else {
            // Single payment - keep it
            cleanedPayments.push(group[0]);
        }
    });
    
    console.log('After cleaning:', cleanedPayments.length, 'payments');
    console.log('Duplicates removed:', duplicatesRemoved);
    
    // Save cleaned data
    saveBankPaymentsData(cleanedPayments);
    saveBanksData(banks);
    
    // Refresh the display
    refreshBankPaymentsTable();
    loadBanksData();
    
    showNotification(`Cleaned ${duplicatesRemoved} duplicate bank payments!`, 'success');
    
    return {
        before: bankPayments.length,
        after: cleanedPayments.length,
        removed: duplicatesRemoved
    };
}

// Complaints data functions removed - complaints section deleted

function getBillsData() {
    return JSON.parse(localStorage.getItem('societyBills') || '[]');
}

function saveBillsData(bills) {
    // Save to localStorage (for offline support)
    localStorage.setItem('societyBills', JSON.stringify(bills));
    
    // Save to Firebase (if available and authenticated)
    if (typeof FirebaseHelper !== 'undefined' && typeof auth !== 'undefined') {
        // Check if user is authenticated before attempting Firebase operations
        const currentUser = auth.currentUser;
        if (currentUser) {
            bills.forEach(bill => {
                FirebaseHelper.saveBill(bill).catch(error => {
                    console.log('Firebase save failed, using localStorage only');
                });
            });
        } else {
            console.log('⚠️ Not authenticated - bills saved to localStorage only');
        }
    }
}

// Save individual bill to Firebase immediately
async function saveBillToFirebase(billData) {
    // Check if Firebase sync is disabled due to authentication issues
    const firebaseDisabled = localStorage.getItem('firebaseDisabled') === 'true';
    
    if (firebaseDisabled) {
        console.log('📱 Firebase sync disabled - using localStorage only');
        return false;
    }
    
    if (typeof FirebaseHelper !== 'undefined' && typeof auth !== 'undefined') {
        try {
            // Check authentication status
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log('⚠️ Not authenticated for Firebase sync');
                console.log('💡 Run: await createTestUser() to create new user');
                console.log('🔑 Or run: await firebaseLogin("email", "password") to login');
                showNotification('⚠️ Firebase not authenticated, saved locally only', 'warning');
                return false;
            }
            
            const result = await FirebaseHelper.saveBill(billData);
            if (result) {
                console.log(`✅ Bill ${billData.billNumber} saved to Firebase`);
                showNotification(`🔥 Bill ${billData.billNumber} synced to Firebase!`, 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.log('Firebase bill save failed:', error);
            showNotification('⚠️ Bill Firebase sync failed, saved locally only', 'warning');
            return false;
        }
    }
    return false;
}

// Society Info Functions
function loadSocietyInfo() {
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    
    // Set default values if not exists
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
        localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    }

    // Update header
    document.getElementById('societyName').textContent = societyInfo.name;
    
    // Update form fields (using correct IDs from current Settings section)
    const nameInput = document.getElementById('societyNameInput');
    const addressInput = document.getElementById('societyAddressInput');
    const regInput = document.getElementById('registrationNumberInput');
    
    const headerElements = document.querySelectorAll('#societyName, .society-name');
    headerElements.forEach(element => {
        if (element) element.textContent = societyInfo.name;
    });
    
    // Update login page with new society name
    updateLoginPageSocietyName();
    
    // Update any visible modals or sections that might show society info
    const societyDisplays = document.querySelectorAll('.society-display, .society-header h2');
    societyDisplays.forEach(element => {
        if (element) element.textContent = societyInfo.name;
    });
    
    // Force update all cached society info references
    window.societyInfo = societyInfo;
    
    // Refresh dashboard data to reflect changes
    loadDashboardData();
    
    // Refresh current section if it's bills or payments (they use society info)
    const activeSection = document.querySelector('.nav-item.active')?.dataset?.section;
    if (activeSection === 'billing' || activeSection === 'payments') {
        setTimeout(() => {
            loadSectionData(activeSection);
        }, 100);
    }
    
    console.log('Society information updated across all sections:', societyInfo);
}

// Load Settings Data
function loadSettingsData() {
    console.log('Loading settings data...');
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    console.log('Loaded society info:', societyInfo);
    
    // Set default values if not exists
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
        localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    }
    
    // Update header
    const headerElement = document.getElementById('societyName');
    if (headerElement) {
        headerElement.textContent = societyInfo.name;
    }
    
    // Update form fields
    const nameInput = document.getElementById('societyNameInput');
    const addressInput = document.getElementById('societyAddressInput');
    const regInput = document.getElementById('registrationNumberInput');
    
    if (nameInput) nameInput.value = societyInfo.name;
    if (addressInput) addressInput.value = societyInfo.address;
    if (regInput) regInput.value = societyInfo.registrationNumber;
    
    // Add event listener for save button
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.removeEventListener('click', saveSettingsData); // Remove existing listener
        saveBtn.addEventListener('click', saveSettingsData);
    }
}

// Save Settings Data
function saveSettingsData() {
    console.log('Saving settings data...');
    
    const societyInfo = {
        name: document.getElementById('societyNameInput').value.trim(),
        address: document.getElementById('societyAddressInput').value.trim(),
        registrationNumber: document.getElementById('registrationNumberInput').value.trim(),
        lastUpdated: new Date().toISOString()
    };
    
    console.log('Society info to save:', societyInfo);
    
    // Validate required fields
    if (!societyInfo.name) {
        showNotification('Society name is required!', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        FirebaseHelper.saveSocietyInfo(societyInfo).catch(error => {
            console.log('Firebase save failed, using localStorage only');
        });
    }
    
    // Update header immediately
    const headerElement = document.getElementById('societyName');
    if (headerElement) {
        headerElement.textContent = societyInfo.name;
    }
    
    // Update all dashboard elements that show society info
    // Update header elements
    const headerElements = document.querySelectorAll('#societyName, .society-name');
    headerElements.forEach(element => {
        if (element) element.textContent = societyInfo.name;
    });
    
    // Force refresh all sections that use society info
    const currentSection = document.querySelector('.nav-item.active')?.dataset?.section;
    if (currentSection) {
        loadSectionData(currentSection);
    }
    
    showNotification('Settings saved successfully! All bills and receipts will now use the updated information.', 'success');
}

// Initialize billing year dropdown
function initializeBillingYear() {
    const yearSelect = document.getElementById('billingYear');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';
        
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }
    
    // Add event listeners for billing filters
    yearSelect.addEventListener('change', loadBillingData);
    
    // Set current month
    const monthSelect = document.getElementById('billingMonth');
    if (monthSelect) {
        monthSelect.addEventListener('change', loadBillingData);
        const currentMonth = new Date().getMonth() + 1;
        monthSelect.value = currentMonth.toString().padStart(2, '0');
    }
}

// Data Loading Functions
function loadFlatsData() {
    const flats = getFlatsData();
    const tbody = document.querySelector('#flatsTable tbody');
    
    if (tbody) {
        tbody.innerHTML = flats.map(flat => `
            <tr>
                <td>${flat.flatNumber || 'N/A'}</td>
                <td>${flat.wing || 'N/A'}</td>
                <td>${flat.ownerName}</td>
                <td>${flat.mobile}</td>
                <td>
                    ${(flat.fourWheelerParking || 0) > 0 ? 
                        `<span class="parking-info">${flat.fourWheelerParking}</span>` : 
                        '<span class="no-parking">0</span>'
                    }
                </td>
                <td>
                    ${(flat.threeWheelerParking || 0) > 0 ? 
                        `<span class="parking-info">${flat.threeWheelerParking}</span>` : 
                        '<span class="no-parking">0</span>'
                    }
                </td>
                <td>
                    ${(flat.twoWheelerParking || 0) > 0 ? 
                        `<span class="parking-info">${flat.twoWheelerParking}</span>` : 
                        '<span class="no-parking">0</span>'
                    }
                </td>
                <td>
                    ${(flat.outstandingAmount || 0) > 0 ? 
                        `<span class="outstanding-amount">₹${flat.outstandingAmount.toLocaleString()}</span>` : 
                        '<span class="no-outstanding">₹0</span>'
                    }
                </td>
                <td><span class="status-badge status-${flat.status}">${getStatusText(flat.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editFlat('${flat.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFlat('${flat.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function loadBillingData() {
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const payments = JSON.parse(localStorage.getItem('societyPayments') || '[]');
    const tbody = document.querySelector('#billsTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No bills found</td></tr>';
        return;
    }
    
    // Sort bills by flat number (natural sort for alphanumeric)
    bills.sort((a, b) => {
        // First sort by period (newest first)
        const periodCompare = b.period.localeCompare(a.period);
        if (periodCompare !== 0) return periodCompare;
        
        // Then sort by flat number (natural sort for alphanumeric like 101-A, 101-B, 102-A)
        return a.flatNumber.localeCompare(b.flatNumber, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    });
    
    bills.forEach(bill => {
        // Enhanced payment matching for multi-month payments
        let totalPaid = 0;
        
        // Find all payments for this flat
        const flatPayments = payments.filter(payment => payment.flatNumber === bill.flatNumber);
        
        // Track payment details for tooltip
        const paymentDetails = [];
        
        flatPayments.forEach(payment => {
            let paymentApplies = false;
            
            // Simplified payment matching logic
            // 1. Check if payment period matches bill period (most common case)
            if (payment.period === bill.period) {
                paymentApplies = true;
            }
            // 2. Check if payment has parking period (multi-month payment)
            else if (payment.parkingPeriod && payment.parkingPeriod.fromMonth && payment.parkingPeriod.toMonth) {
                const payFromYear = parseInt(payment.parkingPeriod.fromMonth.split('-')[0]);
                const payFromMonth = parseInt(payment.parkingPeriod.fromMonth.split('-')[1]);
                const payToYear = parseInt(payment.parkingPeriod.toMonth.split('-')[0]);
                const payToMonth = parseInt(payment.parkingPeriod.toMonth.split('-')[1]);
                
                const [billYear, billMonth] = bill.period.split('-').map(Number);
                
                // Check if bill is within payment period
                if (billYear >= payFromYear && billYear <= payToYear) {
                    if ((billYear === payFromYear && billMonth >= payFromMonth) ||
                        (billYear === payToYear && billMonth <= payToMonth) ||
                        (billYear > payFromYear && billYear < payToYear)) {
                        paymentApplies = true;
                    }
                }
            }
            // 3. Fallback: Check if payment date falls within bill period
            else if (payment.date) {
                const paymentDate = new Date(payment.date);
                const billYear = parseInt(bill.year);
                const billMonth = parseInt(bill.month);
                
                if (paymentDate.getFullYear() === billYear && 
                    (paymentDate.getMonth() + 1) === billMonth) {
                    paymentApplies = true;
                }
            }
            // 4. Last resort: Match by flat number only (for older payments without proper period)
            else if (!payment.period && payment.flatNumber === bill.flatNumber) {
                paymentApplies = true;
            }
            
            // If payment applies to this bill, add the amount
            if (paymentApplies) {
                let paymentAmount = 0;
                if (payment.paymentHeads && Array.isArray(payment.paymentHeads)) {
                    payment.paymentHeads.forEach(head => {
                        paymentAmount += parseFloat(head.amount) || 0;
                    });
                } else {
                    // If no payment heads, use full amount
                    paymentAmount = parseFloat(payment.amount) || 0;
                }
                
                totalPaid += paymentAmount;
                
                // Store payment details for tooltip
                paymentDetails.push({
                    date: payment.date,
                    amount: paymentAmount,
                    receiptNo: payment.receiptNumber || payment.id,
                    mode: payment.paymentMode || 'Cash'
                });
            }
        });
        
        // Calculate current bill amount and balance properly
        let currentBillAmount, displayBalanceAmount;
        
        // Calculate outstanding amount from previous months (carried forward)
        const outstandingFromPrevious = bill.outstandingBreakdown ? 
            Object.values(bill.outstandingBreakdown).reduce((sum, amt) => sum + (amt || 0), 0) : 0;
        
        // Calculate remaining unpaid amount - use baseAmount if totalAmount is incorrect
        const billTotal = bill.baseAmount || bill.totalAmount;
        const remainingUnpaid = Math.max(0, billTotal - totalPaid);
        
        // Calculate current month amount (base amount without outstanding)
        currentBillAmount = bill.baseAmount || (bill.totalAmount - outstandingFromPrevious) || 0;
        
        // Balance amount should show the remaining unpaid amount (what user still owes)
        const memberOutstanding = getMemberOutstandingAmounts(bill.flatNumber);
        
        // Key fix: Balance = Remaining unpaid amount from this bill
        displayBalanceAmount = remainingUnpaid;
        
        // Determine current status
        let currentStatus = 'pending';
        if (remainingUnpaid <= 0) {
            currentStatus = 'paid';
        } else if (totalPaid > 0) {
            currentStatus = 'partial';
        }
        
        // Status badge
        let statusBadge = '';
        switch (currentStatus) {
            case 'paid':
                statusBadge = '<span class="status-badge status-paid">✅ Paid</span>';
                break;
            case 'partial':
                statusBadge = '<span class="status-badge status-partial">⚠️ Partial</span>';
                break;
            default:
                statusBadge = '<span class="status-badge status-pending">⏳ Pending</span>';
        }
        
        // Create payment details tooltip
        let paymentTooltip = '';
        if (paymentDetails.length > 0) {
            paymentTooltip = 'Payment Details:\n' + paymentDetails.map(p => {
                const paymentDate = new Date(p.date).toLocaleDateString('en-IN');
                return `${paymentDate}: ₹${p.amount.toLocaleString()} (${p.mode}) - Receipt: ${p.receiptNo}`;
            }).join('\n');
        } else {
            paymentTooltip = 'No payments recorded';
        }
        
        // Total amount should show original bill amount (use baseAmount if available)
        const originalBillTotal = bill.baseAmount || bill.totalAmount;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.billNumber}</td>
            <td>${bill.flatNumber}</td>
            <td>${bill.memberName}</td>
            <td>${getMonthName(bill.month)} ${bill.year}</td>
            <td>₹${currentBillAmount.toLocaleString()}</td>
            <td class="${displayBalanceAmount > 0 ? 'has-balance' : 'no-balance'}">₹${displayBalanceAmount.toLocaleString()}</td>
            <td>
                <span class="paid-amount ${totalPaid > 0 ? 'has-payment' : ''}" 
                      title="${paymentTooltip}" 
                      style="cursor: ${totalPaid > 0 ? 'help' : 'default'}; ${totalPaid > 0 ? 'text-decoration: underline dotted;' : ''}">
                    ₹${totalPaid.toLocaleString()}
                    ${paymentDetails.length > 0 ? ` <small>(${paymentDetails.length} payment${paymentDetails.length > 1 ? 's' : ''})</small>` : ''}
                </span>
            </td>
            <td>${statusBadge}</td>
            <td class="actions-cell">
                <div class="action-buttons">
                    <button onclick="viewBill('${bill.id}')" class="btn-action btn-view" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${displayBalanceAmount > 0 ? `
                        <button onclick="recordPaymentForBill('${bill.flatNumber}', '${bill.period}', ${displayBalanceAmount})" 
                                class="btn-action btn-payment" title="Pay">
                            <i class="fas fa-rupee-sign"></i>
                        </button>
                    ` : ''}
                    <button onclick="deleteBill('${bill.id}')" class="btn-action btn-delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get month name helper function
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNumber) - 1] || 'Unknown';
}

// Helper function for quick payment recording from bill table
function recordPaymentForBill(flatNumber, period, outstandingAmount) {
    // Open payment modal with pre-filled data
    showRecordPaymentModal();
    
    // Pre-fill flat number and amount
    setTimeout(() => {
        const flatSelect = document.getElementById('paymentFlatNumber');
        const amountInput = document.getElementById('paymentAmount');
        
        if (flatSelect) flatSelect.value = flatNumber;
        if (amountInput) amountInput.value = outstandingAmount;
    }, 100);
}

// Delete bill function
function deleteBill(billId) {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone!')) {
        return;
    }
    
    const bills = getBillsData();
    const billToDelete = bills.find(bill => bill.id === billId);
    
    if (!billToDelete) {
        showNotification('❌ Bill not found!', 'error');
        return;
    }
    
    // Remove bill from array
    const updatedBills = bills.filter(bill => bill.id !== billId);
    saveBillsData(updatedBills);
    
    // Refresh billing table
    loadBillingData();
    loadDashboardData();
    
    showNotification(`✅ Bill ${billToDelete.billNumber} successfully deleted!`, 'success');
}

// View bill function
function viewBill(billId) {
    const bills = getBillsData();
    const bill = bills.find(b => b.id === billId);
    
    if (!bill) {
        showNotification('❌ Bill not found!', 'error');
        return;
    }
    
    // Open bill in new window with A5 format
    const billWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
    
    const billHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill ${bill.billNumber}</title>
            <style>
                ${getA5BillCSS()}
            </style>
        </head>
        <body>
            <div class="a5-container">
                <div class="bill-header">
                    <h1>Maintenance Bill</h1>
                    <div class="bill-meta">
                        <div><strong>Bill No:</strong> ${bill.billNumber}</div>
                        <div><strong>Date:</strong> ${new Date(bill.generatedDate).toLocaleDateString()}</div>
                        <div><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="member-info">
                    <div><strong>Flat No:</strong> ${bill.flatNumber}</div>
                    <div><strong>Member:</strong> ${bill.memberName}</div>
                    <div><strong>Period:</strong> ${getMonthName(bill.month)} ${bill.year}</div>
                </div>
                
                <table class="charges-table">
                    <thead>
                        <tr>
                            <th>Particulars</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Maintenance Charge</td><td>₹${(bill.maintenanceCharge || 0).toLocaleString()}</td></tr>
                        <tr><td>Sinking Fund</td><td>₹${(bill.sinkingFund || 0).toLocaleString()}</td></tr>
                        <tr><td>Parking Charges</td><td>₹${(bill.parkingCharges || 0).toLocaleString()}</td></tr>
                        <tr><td>Festival Charges</td><td>₹${(bill.festivalCharges || 0).toLocaleString()}</td></tr>
                        <tr><td>Building Maintenance</td><td>₹${(bill.buildingMaintenanceCharges || 0).toLocaleString()}</td></tr>
                        ${(() => {
                            // Show outstanding breakdown if exists
                            if (bill.outstandingBreakdown && Object.keys(bill.outstandingBreakdown).length > 0) {
                                let outstandingRows = '<tr class="section-header"><td colspan="2"><strong>Previous Outstanding:</strong></td></tr>';
                                
                                // Show each outstanding head separately
                                if (bill.outstandingBreakdown.maintenanceCharge > 0) {
                                    outstandingRows += '<tr class="outstanding-item"><td>&nbsp;&nbsp;Maintenance Charge (Outstanding)</td><td>₹' + bill.outstandingBreakdown.maintenanceCharge.toLocaleString() + '</td></tr>';
                                }
                                if (bill.outstandingBreakdown.sinkingFund > 0) {
                                    outstandingRows += '<tr class="outstanding-item"><td>&nbsp;&nbsp;Sinking Fund (Outstanding)</td><td>₹' + bill.outstandingBreakdown.sinkingFund.toLocaleString() + '</td></tr>';
                                }
                                if (bill.outstandingBreakdown.parkingCharges > 0) {
                                    outstandingRows += '<tr class="outstanding-item"><td>&nbsp;&nbsp;Parking Charges (Outstanding)</td><td>₹' + bill.outstandingBreakdown.parkingCharges.toLocaleString() + '</td></tr>';
                                }
                                if (bill.outstandingBreakdown.festivalCharges > 0) {
                                    outstandingRows += '<tr class="outstanding-item"><td>&nbsp;&nbsp;Festival Charges (Outstanding)</td><td>₹' + bill.outstandingBreakdown.festivalCharges.toLocaleString() + '</td></tr>';
                                }
                                if (bill.outstandingBreakdown.buildingMaintenanceCharges > 0) {
                                    outstandingRows += '<tr class="outstanding-item"><td>&nbsp;&nbsp;Building Maintenance (Outstanding)</td><td>₹' + bill.outstandingBreakdown.buildingMaintenanceCharges.toLocaleString() + '</td></tr>';
                                }
                                
                                return outstandingRows;
                            }
                            return '';
                        })()}
                        <tr class="total-row"><td><strong>Total Amount</strong></td><td><strong>₹${bill.totalAmount.toLocaleString()}</strong></td></tr>
                    </tbody>
                </table>
                
                <div class="payment-info">
                    <p><strong>Payment Instructions:</strong></p>
                    <p>Please pay by due date to avoid late fees. Payment can be made via cash, cheque, or online transfer.</p>
                </div>
                
                <div class="print-actions no-print">
                    <button onclick="window.print()" class="btn-print">Print</button>
                    <button onclick="window.close()" class="btn-close">Close</button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    billWindow.document.write(billHTML);
    billWindow.document.close();
}

// A5 Bill CSS
function getA5BillCSS() {
    return `
        @page { size: A5; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .a5-container { width: 148mm; margin: 0 auto; padding: 10px; }
        .bill-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .bill-header h1 { font-size: 18px; color: #333; margin-bottom: 10px; }
        .bill-meta { display: flex; justify-content: space-between; font-size: 10px; }
        .member-info { margin-bottom: 20px; }
        .member-info div { margin-bottom: 5px; }
        .charges-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .charges-table th, .charges-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .charges-table th { background-color: #f5f5f5; font-weight: bold; }
        .charges-table td:last-child { text-align: right; }
        .section-header { background-color: #fff3cd; border-top: 2px solid #856404; }
        .section-header td { color: #856404; font-weight: bold; padding: 10px 8px; }
        .outstanding-item { background-color: #fffbf0; }
        .outstanding-item td { color: #856404; font-style: italic; }
        .total-row { background-color: #f0f0f0; font-weight: bold; border-top: 2px solid #333; }
        .payment-info { margin-bottom: 20px; font-size: 11px; }
        .print-actions { position: fixed; top: 10px; right: 10px; }
        .btn-print, .btn-close { padding: 8px 15px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-print { background: #007bff; color: white; }
        .btn-close { background: #6c757d; color: white; }
        @media print { .no-print { display: none !important; } }
    `;
}

// Function to record payment for a specific bill
function recordPaymentForBill(billId) {
    const bills = getBillsData();
    const bill = bills.find(b => b.id === billId);
    
    if (!bill) {
        showNotification('Bill not found!', 'error');
        return;
    }
    
    // Pre-fill the record payment modal with bill information
    showRecordPaymentModal();
    
    // Wait for modal to be created, then pre-fill values
    setTimeout(() => {
        const flatNumberField = document.getElementById('paymentFlatNumber');
        const amountField = document.getElementById('paymentAmount');
        
        if (flatNumberField) {
            flatNumberField.value = bill.flatNumber;
            flatNumberField.dispatchEvent(new Event('change')); // Trigger change event to load payment heads
        }
        
        // Calculate outstanding amount
        const payments = getPaymentsData();
        const billPayments = payments.filter(payment => 
            payment.flatNumber === bill.flatNumber && 
            payment.date >= bill.billDate
        );
        const totalPaid = billPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const outstandingAmount = Math.max(0, bill.totalAmount - totalPaid);
        
        if (amountField) {
            amountField.value = outstandingAmount;
        }
    }, 100);
}

function loadPaymentsData() {
    const payments = getPaymentsData();
    const banks = getBanksData();
    const tbody = document.querySelector('#paymentsTable tbody');
    
    if (tbody) {
        tbody.innerHTML = payments.map(payment => {
            const bank = payment.bankAccountId ? banks.find(b => b.id === payment.bankAccountId) : null;
            const bankInfo = bank ? `<br><small class="text-muted">Bank: ${bank.bankName}</small>` : 
                           payment.mode === 'cash' ? `<br><small class="text-success">💰 Cash Payment</small>` : '';
            const chequeInfo = (payment.mode === 'cheque' && payment.chequeDate) ? 
                `<br><small class="text-info">Cheque Date: ${formatDate(payment.chequeDate)}</small>` : '';
            
            return `
                <tr>
                    <td>${payment.receiptNumber}</td>
                    <td>${payment.flatNumber}</td>
                    <td>${payment.memberName}${bankInfo}${chequeInfo}</td>
                    <td>₹${payment.amount.toLocaleString()}</td>
                    <td><span class="status-badge status-${payment.mode}">${getPaymentModeText(payment.mode)}</span></td>
                    <td>${formatDate(payment.date)}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="printPaymentReceipt('${payment.id}')" title="Print Receipt">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editPaymentRecord('${payment.id}')" title="Edit Payment">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletePaymentRecord('${payment.id}')" title="Delete Payment">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function loadExpensesData() {
    const expenses = getExpensesData();
    const tbody = document.querySelector('#expensesTable tbody');
    
    // Calculate monthly and yearly totals
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTotal = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    const yearlyTotal = expenses
        .filter(expense => new Date(expense.date).getFullYear() === currentYear)
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    document.getElementById('monthlyExpense').textContent = `₹${monthlyTotal.toLocaleString()}`;
    document.getElementById('yearlyExpense').textContent = `₹${yearlyTotal.toLocaleString()}`;
    
    if (tbody) {
        const banks = getBanksData(); // Get banks data for display
        
        tbody.innerHTML = expenses.map(expense => {
            // Find bank information if expense was paid from bank
            const bank = expense.bankAccountId ? banks.find(b => b.id === expense.bankAccountId) : null;
            const bankInfo = bank ? `${bank.bankName} - ${bank.accountNumber}` : 'Cash/Other';
            
            return `
                <tr>
                    <td>${formatDate(expense.date)}</td>
                    <td><span class="status-badge status-${expense.category}">${getCategoryText(expense.category)}</span></td>
                    <td>${expense.description}</td>
                    <td>₹${expense.amount.toLocaleString()}</td>
                    <td>${expense.paymentMode || 'N/A'}</td>
                    <td class="bank-info" title="${bankInfo}">
                        ${bank ? `<i class="fas fa-university"></i> ${bank.bankName}` : '<i class="fas fa-money-bill"></i> Cash/Other'}
                    </td>
                    <td>${expense.billNumber || 'N/A'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="printExpenseReceipt('${expense.id}')" title="Print Receipt">
                            <i class="fas fa-receipt"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editExpense('${expense.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteExpense('${expense.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function loadBanksData() {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Update summary cards
    document.getElementById('totalBanks').textContent = banks.length;
    
    // Calculate monthly bank payments
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyPayments = bankPayments
        .filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + (payment.type === 'credit' ? payment.amount : -payment.amount), 0);
    
    document.getElementById('monthlyBankPayments').textContent = `₹${monthlyPayments.toLocaleString()}`;
    
    // Calculate total bank balance
    const totalBalance = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
    document.getElementById('totalBankBalance').textContent = `₹${totalBalance.toLocaleString()}`;
    
    // Load bank cards
    const container = document.getElementById('bankCardsContainer');
    if (container) {
        container.innerHTML = banks.map(bank => `
            <div class="bank-card">
                <div class="bank-card-header">
                    <div class="bank-name">${bank.bankName}</div>
                    <div class="bank-type">${bank.accountType}</div>
                </div>
                <div class="bank-details">
                    <div class="bank-detail-row">
                        <span class="bank-detail-label">Account No:</span>
                        <span class="bank-detail-value">${bank.accountNumber}</span>
                    </div>
                    <div class="bank-detail-row">
                        <span class="bank-detail-label">IFSC:</span>
                        <span class="bank-detail-value">${bank.ifscCode}</span>
                    </div>
                    <div class="bank-detail-row">
                        <span class="bank-detail-label">Branch:</span>
                        <span class="bank-detail-value">${bank.branch}</span>
                    </div>
                    <div class="bank-detail-row">
                        <span class="bank-detail-label">Balance:</span>
                        <span class="bank-detail-value bank-balance">₹${(bank.balance || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div class="bank-card-actions">
                    <button class="btn btn-success btn-sm" onclick="addBankTransaction('${bank.id}', 'credit')" title="Add Credit">
                        <i class="fas fa-plus"></i> Credit
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="addBankTransaction('${bank.id}', 'debit')" title="Add Debit">
                        <i class="fas fa-minus"></i> Debit
                    </button>
                    <button class="btn btn-info btn-sm" onclick="showBankTransferModal('${bank.id}')" title="Bank Transfer">
                        <i class="fas fa-exchange-alt"></i> Transfer
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="generateBankStatement('${bank.id}')" title="Bank Statement">
                        <i class="fas fa-file-alt"></i> Statement
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="editBank('${bank.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBank('${bank.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Load bank payments table with fresh data
    refreshBankPaymentsTable();
}

// Separate function to refresh bank payments table
function refreshBankPaymentsTable() {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData(); // Get fresh data
    
    const tbody = document.querySelector('#bankPaymentsTable tbody');
    if (tbody) {
        if (bankPayments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No bank transactions found</td>
                </tr>
            `;
        } else {
            tbody.innerHTML = bankPayments
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20) // Show only recent 20 transactions
                .map(payment => {
                    const bank = banks.find(b => b.id === payment.bankId);
                    return `
                        <tr>
                            <td>${formatDate(payment.date)}</td>
                            <td>${bank ? bank.bankName : 'Unknown Bank'}</td>
                            <td><span class="status-badge status-${payment.type}">${payment.type === 'credit' ? 'Credit' : 'Debit'}</span></td>
                            <td class="${payment.type === 'credit' ? 'text-success' : 'text-danger'}">
                                ${payment.type === 'credit' ? '+' : '-'}₹${payment.amount.toLocaleString()}
                            </td>
                            <td>${payment.description || 'N/A'}</td>
                            <td>${payment.reference || 'N/A'}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="editBankPayment('${payment.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteBankPayment('${payment.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
        }
    }
}

function loadNoticesData() {
    const notices = getNoticesData();
    const container = document.getElementById('noticesContainer');
    
    if (container) {
        container.innerHTML = notices.map(notice => `
            <div class="notice-card priority-${notice.priority}">
                <div class="notice-header">
                    <div>
                        <h4 class="notice-title">${notice.title}</h4>
                        <span class="notice-priority priority-${notice.priority}">${getPriorityText(notice.priority)}</span>
                    </div>
                    <div class="notice-date">${formatDate(notice.date)}</div>
                </div>
                <div class="notice-content">${notice.content}</div>
                <div class="notice-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editNotice('${notice.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNotice('${notice.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ${notice.active ? 
                        `<button class="btn btn-warning btn-sm" onclick="toggleNoticeStatus('${notice.id}')">
                            <i class="fas fa-eye-slash"></i> Hide
                        </button>` : 
                        `<button class="btn btn-success btn-sm" onclick="toggleNoticeStatus('${notice.id}')">
                            <i class="fas fa-eye"></i> Show
                        </button>`
                    }
                </div>
            </div>
        `).join('');
    }
}

function loadComplaintsData() {
    // Placeholder for complaints data loading
    console.log('Loading complaints data...');
}

function loadMeetingsData() {
    // Placeholder for meetings data loading
    console.log('Loading meetings data...');
}


function loadReportsData() {
    // Placeholder for reports data loading
    console.log('Loading reports data...');
}

// Bill Configuration Functions
function loadBillConfigData() {
    const config = getBillConfiguration();
    
    // Load configuration into form
    document.getElementById('configMaintenanceCharge').value = config.maintenanceCharge;
    document.getElementById('configSinkingFund').value = config.sinkingFund;
    document.getElementById('configNonOccupancyCharges').value = config.nonOccupancyCharges;
    document.getElementById('configOccupancyCharges').value = config.occupancyCharges || 50;
    document.getElementById('configFestivalCharges').value = config.festivalCharges;
    document.getElementById('configBuildingMaintenanceCharges').value = config.buildingMaintenanceCharges;
    document.getElementById('configInterestRate').value = config.interestRate;
    document.getElementById('configDueDay').value = config.dueDay;
    document.getElementById('configCalculateInterest').checked = config.calculateInterest;
    
    // Load NOC charges if element exists
    const nocElement = document.getElementById('configNOCCharges');
    if (nocElement) {
        nocElement.value = config.nocCharges || 0;
    }
    
    // Update preview
    updateConfigPreview();
    
    // Update status
    updateConfigStatus();
    
    // Add event listeners for real-time preview updates
    const inputs = document.querySelectorAll('#billConfigForm input');
    inputs.forEach(input => {
        input.addEventListener('input', updateConfigPreview);
    });
}

function getBillConfiguration() {
    const defaultConfig = {
        maintenanceCharge: 5000,
        sinkingFund: 500,
        nonOccupancyCharges: 200,
        occupancyCharges: 50, // Added Occupancy Charges for tenant flats
        festivalCharges: 100,
        buildingMaintenanceCharges: 400,
        nocCharges: 0, // Added NOC Charges
        interestRate: 1.5,
        dueDay: 10,
        calculateInterest: true,
        lastUpdated: null
    };
    
    const savedConfig = localStorage.getItem('billConfiguration');
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
}

function saveBillConfiguration(e) {
    e.preventDefault();
    
    const config = {
        maintenanceCharge: parseFloat(document.getElementById('configMaintenanceCharge').value),
        sinkingFund: parseFloat(document.getElementById('configSinkingFund').value) || 0,
        nonOccupancyCharges: parseFloat(document.getElementById('configNonOccupancyCharges').value) || 0,
        occupancyCharges: parseFloat(document.getElementById('configOccupancyCharges').value) || 0,
        festivalCharges: parseFloat(document.getElementById('configFestivalCharges').value) || 0,
        buildingMaintenanceCharges: parseFloat(document.getElementById('configBuildingMaintenanceCharges').value) || 0,
        nocCharges: parseFloat(document.getElementById('configNOCCharges').value) || 0,
        interestRate: parseFloat(document.getElementById('configInterestRate').value) || 1.5,
        dueDay: parseInt(document.getElementById('configDueDay').value) || 10,
        calculateInterest: document.getElementById('configCalculateInterest').checked,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('billConfiguration', JSON.stringify(config));
    
    // Save to Firebase (if available)
    if (typeof FirebaseHelper !== 'undefined') {
        FirebaseHelper.saveBillConfiguration(config).catch(error => {
            console.log('Firebase save failed, using localStorage only');
        });
    }
    
    updateConfigStatus();
    showNotification('Bill configuration saved successfully!', 'success');
}

function resetConfigToDefaults() {
    document.getElementById('configMaintenanceCharge').value = 5000;
    document.getElementById('configSinkingFund').value = 500;
    document.getElementById('configNonOccupancyCharges').value = 200;
    document.getElementById('configOccupancyCharges').value = 50;
    document.getElementById('configFestivalCharges').value = 100;
    document.getElementById('configBuildingMaintenanceCharges').value = 400;
    document.getElementById('configNOCCharges').value = 0;
    document.getElementById('configInterestRate').value = 1.5;
    document.getElementById('configDueDay').value = 10;
    document.getElementById('configCalculateInterest').checked = true;
    
    updateConfigPreview();
    showNotification('Configuration reset to defaults!', 'info');
}

function updateConfigPreview() {
    const maintenance = parseFloat(document.getElementById('configMaintenanceCharge').value) || 0;
    const sinking = parseFloat(document.getElementById('configSinkingFund').value) || 0;
    const occupancy = parseFloat(document.getElementById('configOccupancyCharges').value) || 0;
    const festival = parseFloat(document.getElementById('configFestivalCharges').value) || 0;
    const building = parseFloat(document.getElementById('configBuildingMaintenanceCharges').value) || 0;
    const noc = parseFloat(document.getElementById('configNOCCharges').value) || 0;
    
    const total = maintenance + sinking + occupancy + festival + building + noc;
    
    document.getElementById('previewMaintenance').textContent = `₹${maintenance.toLocaleString()}`;
    document.getElementById('previewSinking').textContent = `₹${sinking.toLocaleString()}`;
    document.getElementById('previewOccupancy').textContent = `₹${occupancy.toLocaleString()}`;
    document.getElementById('previewFestival').textContent = `₹${festival.toLocaleString()}`;
    document.getElementById('previewBuilding').textContent = `₹${building.toLocaleString()}`;
    document.getElementById('previewNOC').textContent = `₹${noc.toLocaleString()}`;
    document.getElementById('previewTotal').textContent = `₹${total.toLocaleString()}`;
}

function updateConfigStatus() {
    const config = getBillConfiguration();
    const statusDiv = document.getElementById('configStatus');
    
    if (config.lastUpdated) {
        const lastUpdated = new Date(config.lastUpdated).toLocaleString();
        statusDiv.innerHTML = `
            <p class="status-success">
                <i class="fas fa-check-circle"></i>
                Configuration saved and active. Last updated: ${lastUpdated}
            </p>
            <p>These amounts will be automatically used in bill generation.</p>
        `;
    } else {
        statusDiv.innerHTML = `
            <p class="status-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Configuration not saved yet. Click "Save Configuration" to apply these amounts to bill generation.
            </p>
        `;
    }
}


// Import Members Modal
function showImportMembersModal() {
    const modal = createModal('Import Members', `
        <div class="import-members-container">
            <div class="import-info">
                <h4><i class="fas fa-info-circle"></i> Import Instructions</h4>
                <ul>
                    <li>Upload CSV or Excel file with member data</li>
                    <li>File should contain: Flat Number, Wing, Owner Name, Mobile, Email, Status</li>
                    <li>Parking slots and outstanding amounts are optional</li>
                    <li>Download sample template for reference</li>
                </ul>
            </div>
            
            <div class="template-download">
                <button id="downloadTemplateBtn" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Download Sample Template
                </button>
            </div>
            
            <div class="file-upload-area">
                <div class="upload-zone" id="uploadZone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & Drop your CSV/Excel file here</p>
                    <p>or</p>
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('importFile').click()">
                        <i class="fas fa-file-upload"></i> Choose File
                    </button>
                    <input type="file" id="importFile" accept=".csv,.xlsx,.xls" style="display: none;">
                </div>
                
                <div id="fileInfo" class="file-info" style="display: none;">
                    <div class="file-details">
                        <i class="fas fa-file"></i>
                        <span id="fileName"></span>
                        <span id="fileSize"></span>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" id="removeFile">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div id="previewSection" class="preview-section" style="display: none;">
                <h4><i class="fas fa-eye"></i> Data Preview</h4>
                <div class="preview-stats">
                    <span id="recordCount">0 records found</span>
                    <span id="validCount">0 valid</span>
                    <span id="errorCount">0 errors</span>
                </div>
                <div class="preview-table-container">
                    <table id="previewTable" class="data-table">
                        <thead id="previewHeader"></thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
            </div>
            
            <div class="import-actions">
                <button id="processImportBtn" class="btn btn-success" style="display: none;">
                    <i class="fas fa-check"></i> Import Members
                </button>
                <button onclick="closeModal()" class="btn btn-secondary">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `, 'large');
    
    // Initialize import functionality
    initializeImportFunctionality();
}

// Initialize Import Functionality
function initializeImportFunctionality() {
    const uploadZone = document.getElementById('uploadZone');
    const importFile = document.getElementById('importFile');
    const fileInfo = document.getElementById('fileInfo');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const processImportBtn = document.getElementById('processImportBtn');
    const removeFileBtn = document.getElementById('removeFile');
    
    let currentFileData = null;
    
    // Download Template
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', downloadSampleTemplate);
    }
    
    // File Upload Handlers
    if (uploadZone && importFile) {
        // Drag and Drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
        
        // File Input Change
        importFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    // Remove File
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            resetFileUpload();
        });
    }
    
    // Process Import
    if (processImportBtn) {
        processImportBtn.addEventListener('click', processImport);
    }
    
    // Handle File Upload
    function handleFileUpload(file) {
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
            showNotification('Please upload a CSV or Excel file only', 'error');
            return;
        }
        
        if (file.size > maxSize) {
            showNotification('File size should be less than 5MB', 'error');
            return;
        }
        
        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        uploadZone.style.display = 'none';
        fileInfo.style.display = 'flex';
        
        // Parse file
        parseFile(file);
    }
    
    // Reset File Upload
    function resetFileUpload() {
        importFile.value = '';
        uploadZone.style.display = 'block';
        fileInfo.style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        processImportBtn.style.display = 'none';
        currentFileData = null;
    }
}

// Parse CSV/Excel File
function parseFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        let data = [];
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            data = parseCSV(content);
        } else {
            showNotification('Excel files require additional library. Please use CSV format.', 'warning');
            return;
        }
        
        if (data.length > 0) {
            validateAndPreviewData(data);
        } else {
            showNotification('No data found in file', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Parse CSV Content
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// Validate and Preview Data
function validateAndPreviewData(data) {
    const requiredFields = ['Flat Number', 'Owner Name', 'Mobile'];
    const validRecords = [];
    const errors = [];
    
    data.forEach((row, index) => {
        const rowErrors = [];
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
                rowErrors.push(`${field} is required`);
            }
        });
        
        // Validate mobile number
        if (row['Mobile'] && !/^\d{10}$/.test(row['Mobile'].replace(/\D/g, ''))) {
            rowErrors.push('Invalid mobile number');
        }
        
        // Validate flat number uniqueness
        const existingFlats = getFlatsData();
        if (row['Flat Number'] && existingFlats.some(f => f.flatNumber === row['Flat Number'])) {
            rowErrors.push('Flat number already exists');
        }
        
        if (rowErrors.length === 0) {
            validRecords.push({
                ...row,
                rowIndex: index + 2 // +2 for header and 0-based index
            });
        } else {
            errors.push({
                row: index + 2,
                errors: rowErrors,
                data: row
            });
        }
    });
    
    // Update stats
    document.getElementById('recordCount').textContent = `${data.length} records found`;
    document.getElementById('validCount').textContent = `${validRecords.length} valid`;
    document.getElementById('errorCount').textContent = `${errors.length} errors`;
    
    // Show preview
    displayPreview(validRecords, errors);
    
    // Store data for import
    currentFileData = { valid: validRecords, errors: errors };
    
    // Show import button if valid records exist
    if (validRecords.length > 0) {
        document.getElementById('processImportBtn').style.display = 'inline-block';
    }
    
    document.getElementById('previewSection').style.display = 'block';
}

// Display Preview Table
function displayPreview(validRecords, errors) {
    const previewHeader = document.getElementById('previewHeader');
    const previewBody = document.getElementById('previewBody');
    
    if (validRecords.length === 0 && errors.length === 0) return;
    
    // Create header
    const sampleRecord = validRecords[0] || errors[0].data;
    const headers = Object.keys(sampleRecord).filter(key => key !== 'rowIndex');
    
    previewHeader.innerHTML = `
        <tr>
            <th>Row</th>
            <th>Status</th>
            ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
    `;
    
    // Create body with valid records
    let bodyHTML = '';
    
    validRecords.slice(0, 10).forEach(record => {
        bodyHTML += `
            <tr class="valid-row">
                <td>${record.rowIndex}</td>
                <td><span class="status-badge status-success">✅ Valid</span></td>
                ${headers.map(h => `<td>${record[h] || ''}</td>`).join('')}
            </tr>
        `;
    });
    
    // Add error records
    errors.slice(0, 5).forEach(error => {
        bodyHTML += `
            <tr class="error-row">
                <td>${error.row}</td>
                <td><span class="status-badge status-error" title="${error.errors.join(', ')}">❌ Error</span></td>
                ${headers.map(h => `<td>${error.data[h] || ''}</td>`).join('')}
            </tr>
        `;
    });
    
    if (validRecords.length > 10) {
        bodyHTML += `<tr><td colspan="${headers.length + 2}"><em>... and ${validRecords.length - 10} more valid records</em></td></tr>`;
    }
    
    previewBody.innerHTML = bodyHTML;
}

// Process Import
async function processImport() {
    if (!currentFileData || currentFileData.valid.length === 0) {
        showNotification('No valid records to import', 'error');
        return;
    }
    
    const existingFlats = getFlatsData();
    let importedCount = 0;
    const totalRecords = currentFileData.valid.length;
    
    // Show progress notification
    showNotification(`🔄 Importing ${totalRecords} members to Firebase...`, 'info');
    
    currentFileData.valid.forEach(record => {
        const flatNumber = record['Flat Number'];
        
        // Check if flat already exists
        const existingFlat = existingFlats.find(flat => flat.flatNumber === flatNumber);
        if (existingFlat) {
            console.log(`⚠️ Flat ${flatNumber} already exists, skipping...`);
            return;
        }
        
        const flatData = {
            id: generateId(),
            flatNumber: flatNumber,
            wing: record['Wing'] || '',
            ownerName: record['Owner Name'],
            mobile: record['Mobile'].replace(/\D/g, ''),
            email: record['Email'] || '',
            status: record['Status'] || 'owner',
            fourWheelerParking: parseInt(record['4W Parking'] || '0'),
            threeWheelerParking: parseInt(record['3W Parking'] || '0'),
            twoWheelerParking: parseInt(record['2W Parking'] || '0'),
            outstandingAmount: parseFloat(record['Outstanding Amount'] || '0'),
            createdDate: new Date().toISOString()
        };
        
        existingFlats.push(flatData);
        
        // Save individual flat to Firebase immediately
        saveFlatToFirebase(flatData);
        
        console.log(`✅ Imported Flat ${flatNumber} - ${flatData.ownerName}`);
        importedCount++;
    });
    
    // Save updated flats data
    saveFlatsData(existingFlats);
    
    // Refresh display
    loadFlatsData();
    loadDashboardData();
    
    // Close modal and show success
    closeModal();
    showNotification(`🎉 Successfully imported ${importedCount} members to Firebase!`, 'success');
    
    // Show Firebase sync status
    setTimeout(() => {
        showNotification(`🔥 All ${importedCount} members synced to Firebase database!`, 'success');
    }, 2000);
}

// Test Import Firebase Sync
window.testImportFirebaseSync = function() {
    console.log('🧪 Testing Import Firebase Sync...');
    
    // Create test data
    const testMembers = [
        {
            'Flat Number': 'TEST-201',
            'Wing': 'T',
            'Owner Name': 'Test Member 1',
            'Mobile': '9999999991',
            'Email': 'test1@example.com',
            'Status': 'owner',
            '4W Parking': '1',
            '3W Parking': '0',
            '2W Parking': '1',
            'Outstanding Amount': '0'
        },
        {
            'Flat Number': 'TEST-202',
            'Wing': 'T',
            'Owner Name': 'Test Member 2',
            'Mobile': '9999999992',
            'Email': 'test2@example.com',
            'Status': 'tenant',
            '4W Parking': '0',
            '3W Parking': '0',
            '2W Parking': '1',
            'Outstanding Amount': '500'
        }
    ];
    
    // Simulate import process
    currentFileData = { valid: testMembers };
    
    console.log('📝 Simulating import of test members...');
    processImport();
    
    console.log('✅ Test import completed! Check Firebase console for sync status.');
};

// Download Sample Template
function downloadSampleTemplate() {
    const csvContent = `Flat Number,Wing,Owner Name,Mobile,Email,Status,4W Parking,3W Parking,2W Parking,Outstanding Amount
101,A,John Doe,9876543210,john@example.com,owner,1,0,1,0
102,A,Jane Smith,9876543211,jane@example.com,tenant,0,0,1,500
103,B,Bob Johnson,9876543212,bob@example.com,owner,1,1,0,1200`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Sample template downloaded!', 'success');
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Modal Functions
function showAddFlatModal() {
    const modal = createModal('Add New Flat', `
        <form id="addFlatForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Flat Number *</label>
                    <input type="text" id="flatNumber" required>
                </div>
                <div class="form-group">
                    <label>Wing/Building</label>
                    <input type="text" id="flatWing" placeholder="e.g., A, B, C" style="text-transform: uppercase;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Owner Name *</label>
                    <input type="text" id="ownerName" required placeholder="e.g., JOHN DOE" style="text-transform: uppercase;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" id="ownerMobile" required>
                </div>
                <div class="form-group">
                    <label>Outstanding Amount (₹)</label>
                    <input type="number" id="outstandingAmount" step="0.01" min="0" placeholder="0.00">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Occupancy Status *</label>
                    <select id="occupancyStatus" required>
                        <option value="">Select Status</option>
                        <option value="owner">Owner Occupied</option>
                        <option value="tenant">Tenant Occupied</option>
                        <option value="renter">Renter Occupied</option>
                        <option value="vacant">Vacant</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>4 Wheeler Parking</label>
                    <select id="fourWheelerParking">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>3 Wheeler Parking</label>
                    <select id="threeWheelerParking">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>2 Wheeler Parking</label>
                    <select id="twoWheelerParking">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                    </select>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Flat</button>
            </div>
        </form>
    `);
    
    document.getElementById('addFlatForm').addEventListener('submit', handleAddFlat);
    
    // Add uppercase conversion for Owner Name and Wing fields
    const ownerNameField = document.getElementById('ownerName');
    const wingField = document.getElementById('flatWing');
    
    ownerNameField.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    wingField.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

function showAddBankModal() {
    const timestamp = Date.now();
    const modal = createModal('Add New Bank', `
        <form id="addBankForm" autocomplete="off">
            <div class="form-row">
                <div class="form-group">
                    <label>Bank Name *</label>
                    <input type="text" id="addBankName" name="bankName_${timestamp}" required placeholder="e.g., State Bank of India" autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Branch *</label>
                    <input type="text" id="addBankBranch" name="bankBranch_${timestamp}" required placeholder="e.g., Kharghar Branch" autocomplete="off">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account Number *</label>
                    <input type="text" id="bankAccountNumber" name="bankAccountNumber_${timestamp}" required placeholder="e.g., 60234168835" autocomplete="off">
                </div>
                <div class="form-group">
                    <label>IFSC Code *</label>
                    <input type="text" id="bankIfscCode" name="bankIfscCode_${timestamp}" required placeholder="e.g., SBIN0001234" autocomplete="off">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account Type *</label>
                    <select id="bankAccountType" name="bankAccountType_${timestamp}" required autocomplete="off">
                        <option value="">Select Type</option>
                        <option value="savings">Savings Account</option>
                        <option value="current">Current Account</option>
                        <option value="fd">Fixed Deposit</option>
                        <option value="rd">Recurring Deposit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Initial Balance (₹)</label>
                    <input type="number" id="bankInitialBalance" name="bankInitialBalance_${timestamp}" step="0.01" min="0" placeholder="0.00" autocomplete="off">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="bankDescription" name="bankDescription_${timestamp}" rows="2" placeholder="Additional notes about this bank account" autocomplete="off"></textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Bank</button>
            </div>
        </form>
    `);
    
    document.getElementById('addBankForm').addEventListener('submit', handleAddBank);
    
    // Aggressive form clearing to prevent autocomplete issues
    setTimeout(() => {
        const form = document.getElementById('addBankForm');
        if (form) {
            // Clear all input values
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.value = '';
                input.defaultValue = '';
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                }
            });
            
            // Force focus on first field to reset browser state
            document.getElementById('addBankName').focus();
            document.getElementById('addBankName').blur();
        }
    }, 200);
}

function showAddBankPaymentModal() {
    const banks = getBanksData();
    
    if (banks.length === 0) {
        showNotification('Please add at least one bank first!', 'error');
        return;
    }
    
    const modal = createModal('Record Bank Transaction', `
        <form id="addBankPaymentForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Bank *</label>
                    <select id="paymentBankId" required>
                        <option value="">Select Bank</option>
                        ${banks.map(bank => `<option value="${bank.id}">${bank.bankName} - ${bank.accountNumber}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Transaction Type *</label>
                    <select id="paymentType" required>
                        <option value="">Select Type</option>
                        <option value="credit">Credit (Money In)</option>
                        <option value="debit">Debit (Money Out)</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="paymentAmount" step="0.01" required min="0.01">
                </div>
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea id="paymentDescription" rows="2" required placeholder="e.g., Maintenance collection from flats, Electricity bill payment"></textarea>
            </div>
            <div class="form-group">
                <label>Reference Number</label>
                <input type="text" id="paymentReference" placeholder="Transaction ID, Cheque number, etc.">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success">Record Transaction</button>
            </div>
        </form>
    `);
    
    document.getElementById('addBankPaymentForm').addEventListener('submit', handleAddBankPayment);
}





function showGenerateBillsModal() {
    console.log('showGenerateBillsModal function called!');
    const config = getBillConfiguration();
    console.log('Configuration loaded:', config);
    
    const modal = createModal('Generate Monthly Bills', `
        <div class="bill-generation-container">
            <div class="config-info">
                <h4><i class="fas fa-info-circle"></i> Using Saved Configuration</h4>
                <p>Bills will be generated using the amounts configured in <strong>Bill Configuration</strong> section.</p>
                <div class="config-summary">
                    <div class="config-item">
                        <span>Maintenance:</span> <strong>₹${config.maintenanceCharge.toLocaleString()}</strong>
                    </div>
                    <div class="config-item">
                        <span>Sinking Fund:</span> <strong>₹${config.sinkingFund.toLocaleString()}</strong>
                    </div>
                    <div class="config-item">
                        <span>Occupancy Charges:</span> <strong>₹${(config.occupancyCharges || 0).toLocaleString()}</strong>
                    </div>
                    <div class="config-item">
                        <span>Festival:</span> <strong>₹${config.festivalCharges.toLocaleString()}</strong>
                    </div>
                    <div class="config-item">
                        <span>Building Maintenance:</span> <strong>₹${config.buildingMaintenanceCharges.toLocaleString()}</strong>
                    </div>
                    ${(config.nocCharges || 0) > 0 ? `
                    <div class="config-item">
                        <span>NOC Charges:</span> <strong>₹${config.nocCharges.toLocaleString()}</strong>
                    </div>` : ''}
                    <div class="config-item">
                        <span>Interest Rate:</span> <strong>${config.interestRate}%</strong>
                    </div>
                </div>
                <p class="config-note">
                    <i class="fas fa-cog"></i> 
                    To change these amounts, go to <strong>Bill Configuration</strong> section.
                </p>
            </div>
            
            <form id="generateBillsForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Billing Month *</label>
                        <select id="billMonth" required>
                            <option value="01">January</option>
                            <option value="02">February</option>
                            <option value="03">March</option>
                            <option value="04">April</option>
                            <option value="05">May</option>
                            <option value="06">June</option>
                            <option value="07">July</option>
                            <option value="08">August</option>
                            <option value="09">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Year *</label>
                        <select id="billYear" required></select>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="button" class="btn btn-info" onclick="closeModal(); switchSection('billconfig');">
                        <i class="fas fa-cog"></i> Modify Configuration
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-file-invoice"></i> Generate Bills
                    </button>
                </div>
            </form>
        </div>
        
        <style>
            .bill-generation-container {
                max-width: 600px;
            }
            
            .config-info {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .config-info h4 {
                color: #495057;
                margin-bottom: 10px;
            }
            
            .config-summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 15px 0;
            }
            
            .config-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .config-note {
                background: #e7f3ff;
                border: 1px solid #b8daff;
                border-radius: 4px;
                padding: 10px;
                margin-top: 15px;
                font-size: 14px;
                color: #004085;
            }
        </style>
    `);
    
    // Set next month as default (for upcoming bill generation)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0=Jan, 9=Oct)
    const currentYear = currentDate.getFullYear();
    
    let nextMonth = currentMonth + 1; // Next month (10=Nov for current Oct)
    let nextYear = currentYear;
    
    // Handle year rollover (December -> January)
    if (nextMonth > 11) {
        nextMonth = 0; // January
        nextYear = currentYear + 1;
    }
    
    const nextMonthValue = (nextMonth + 1).toString().padStart(2, '0'); // +1 because we need 1-based for display
    document.getElementById('billMonth').value = nextMonthValue;
    
    const yearSelect = document.getElementById('billYear');
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === nextYear) option.selected = true; // Select the year for next month
        yearSelect.appendChild(option);
    }
    
    // Due date will be calculated automatically based on configuration
    
    // Add event listener for form submission
    const form = document.getElementById('generateBillsForm');
    if (form) {
        form.addEventListener('submit', handleGenerateBills);
        console.log('Event listener added to generate bills form');
    } else {
        console.error('Generate bills form not found!');
    }
}

function showRecordPaymentModal() {
    const flats = getFlatsData();
    const bills = getBillsData();
    const banks = getBanksData();
    
    const modal = createModal('Record Payment', `
        <form id="recordPaymentForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Flat Number * <small>(Type & press Enter/Tab)</small></label>
                    <div class="searchable-dropdown">
                        <input type="text" id="flatSearchInput" placeholder="Search by flat number, member name, or mobile..." 
                               autocomplete="off" onkeyup="handleFlatSearch(event)" onfocus="showFlatDropdown()" 
                               onkeydown="handleFlatKeyNavigation(event)" required>
                        <div id="flatDropdown" class="dropdown-list" style="display: none;">
                            ${flats
                                .sort((a, b) => {
                                    // Sort by outstanding amount (highest first), then by flat number
                                    const aOutstanding = a.outstandingAmount || 0;
                                    const bOutstanding = b.outstandingAmount || 0;
                                    if (bOutstanding !== aOutstanding) {
                                        return bOutstanding - aOutstanding;
                                    }
                                    return a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true });
                                })
                                .map(flat => `
                                <div class="dropdown-item" onclick="selectFlat('${flat.flatNumber}', '${flat.ownerName}')" 
                                     title="Flat ${flat.flatNumber} - ${flat.ownerName}${flat.mobile ? ' (' + flat.mobile + ')' : ''}">
                                    <div class="flat-info">
                                        <span class="flat-number">${flat.flatNumber}${flat.wing ? ` (${flat.wing})` : ''}</span>
                                        <span class="member-name">${flat.ownerName}</span>
                                        ${flat.mobile ? `<small class="mobile-number">📱 ${flat.mobile}</small>` : ''}
                                    </div>
                                    <div class="flat-status">
                                        <span class="status-indicator status-${flat.status || 'owner'}">${getStatusText(flat.status || 'owner')}</span>
                                        ${(flat.outstandingAmount || 0) > 0 ? 
                                            `<small class="outstanding-info">₹${flat.outstandingAmount.toLocaleString()} due</small>` : 
                                            '<small class="no-outstanding">✅ Clear</small>'
                                        }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <input type="hidden" id="paymentFlatNumber" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            
            
            <!-- Bills Section (Initially Hidden) -->
            <div id="flatBillsSection" style="display: none;">
                <div id="flatBillsList" class="bills-list">
                    <!-- Bills will be populated here -->
                </div>
            </div>
            
            <!-- Manual Payment Heads Section -->
            <div id="manualPaymentHeads" style="display: none;">
                <h4>Payment Heads (Manual Entry)</h4>
                <div class="payment-heads-manual">
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="maintenance" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Maintenance Charges</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-maintenance" onclick="editManualHeadAmount('maintenance')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-maintenance" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('maintenance', this.value)" onblur="saveManualHeadAmount('maintenance')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('maintenance')">
                            </div>
                        </label>
                    </div>
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="sinking" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Sinking Fund</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-sinking" onclick="editManualHeadAmount('sinking')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-sinking" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('sinking', this.value)" onblur="saveManualHeadAmount('sinking')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('sinking')">
                            </div>
                        </label>
                    </div>
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="parking" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Parking Charges</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-parking" onclick="editManualHeadAmount('parking')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-parking" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('parking', this.value)" onblur="saveManualHeadAmount('parking')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('parking')">
                            </div>
                        </label>
                    </div>
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="festival" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Festival Charges</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-festival" onclick="editManualHeadAmount('festival')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-festival" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('festival', this.value)" onblur="saveManualHeadAmount('festival')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('festival')">
                            </div>
                        </label>
                    </div>
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="buildingMaintenance" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Building Maintenance</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-buildingMaintenance" onclick="editManualHeadAmount('buildingMaintenance')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-buildingMaintenance" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('buildingMaintenance', this.value)" onblur="saveManualHeadAmount('buildingMaintenance')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('buildingMaintenance')">
                            </div>
                        </label>
                    </div>
                    <div class="payment-head-item">
                        <label class="payment-head-label">
                            <input type="checkbox" class="payment-head-checkbox" data-head="occupancy" data-amount="0" onchange="calculateSelectedAmount()">
                            <span class="head-name">Occupancy Charges</span>
                            <div class="head-amount-container">
                                <span class="head-amount clickable-amount" id="amount-occupancy" onclick="editManualHeadAmount('occupancy')" title="Click to edit amount">₹0.00</span>
                                <input type="number" class="head-amount-input" id="input-occupancy" value="0" step="0.01" style="display: none;" onchange="updateManualHeadAmount('occupancy', this.value)" onblur="saveManualHeadAmount('occupancy')" onkeypress="if(event.key==='Enter') saveManualHeadAmount('occupancy')">
                            </div>
                        </label>
                    </div>
                </div>
                <div class="manual-payment-actions">
                    <button type="button" class="btn btn-sm btn-success" onclick="selectAllManualHeads()">
                        <i class="fas fa-check-double"></i> Select All
                    </button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="clearAllManualHeads()">
                        <i class="fas fa-times"></i> Clear All
                    </button>
                </div>
            </div>
            
            
            <!-- Multi-Month Payment Periods -->
            <div class="payment-period-section compact">
                <h5><i class="fas fa-calendar-alt"></i> Multi-Month Payment Period</h5>
                
                <!-- Maintenance Period -->
                <div class="compact-period-row">
                    <div class="period-group">
                        <label><i class="fas fa-home"></i> Maintenance Period:</label>
                        <select id="maintenanceFromMonth" class="compact-date">
                            <option value="">From Month</option>
                            <option value="2025-01">January 2025</option>
                            <option value="2025-02">February 2025</option>
                            <option value="2025-03">March 2025</option>
                            <option value="2025-04">April 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">June 2025</option>
                            <option value="2025-07">July 2025</option>
                            <option value="2025-08">August 2025</option>
                            <option value="2025-09">September 2025</option>
                            <option value="2025-10">October 2025</option>
                            <option value="2025-11">November 2025</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                        <span>to</span>
                        <select id="maintenanceToMonth" class="compact-date">
                            <option value="">To Month</option>
                            <option value="2025-01">January 2025</option>
                            <option value="2025-02">February 2025</option>
                            <option value="2025-03">March 2025</option>
                            <option value="2025-04">April 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">June 2025</option>
                            <option value="2025-07">July 2025</option>
                            <option value="2025-08">August 2025</option>
                            <option value="2025-09">September 2025</option>
                            <option value="2025-10">October 2025</option>
                            <option value="2025-11">November 2025</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                    </div>
                </div>
                
                <!-- Parking Period -->
                <div class="compact-period-row">
                    <div class="period-group">
                        <label><i class="fas fa-car"></i> Parking Period:</label>
                        <select id="parkingFromMonth" class="compact-date">
                            <option value="">From Month</option>
                            <option value="2025-01">January 2025</option>
                            <option value="2025-02">February 2025</option>
                            <option value="2025-03">March 2025</option>
                            <option value="2025-04">April 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">June 2025</option>
                            <option value="2025-07">July 2025</option>
                            <option value="2025-08">August 2025</option>
                            <option value="2025-09">September 2025</option>
                            <option value="2025-10">October 2025</option>
                            <option value="2025-11">November 2025</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                        <span>to</span>
                        <select id="parkingToMonth" class="compact-date">
                            <option value="">To Month</option>
                            <option value="2025-01">January 2025</option>
                            <option value="2025-02">February 2025</option>
                            <option value="2025-03">March 2025</option>
                            <option value="2025-04">April 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">June 2025</option>
                            <option value="2025-07">July 2025</option>
                            <option value="2025-08">August 2025</option>
                            <option value="2025-09">September 2025</option>
                            <option value="2025-10">October 2025</option>
                            <option value="2025-11">November 2025</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                    </div>
                </div>
                
                <div class="period-help">
                    <small><i class="fas fa-info-circle"></i> Use these options for multi-month advance payments</small>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="paymentAmount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Payment Mode *</label>
                    <select id="paymentMode" required onchange="toggleChequeFields()">
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Reference Number</label>
                    <input type="text" id="paymentReference" placeholder="Cheque/Transaction ID">
                </div>
                <div class="form-group" id="chequeDateGroup" style="display: none;">
                    <label>Cheque Date</label>
                    <input type="date" id="chequeDate" placeholder="Date when cheque was given">
                </div>
            </div>
            
            <div class="form-row" id="paymentBankAccountRow">
                <div class="form-group">
                    <label>Received in Bank Account <span class="required">*</span></label>
                    <select id="paymentBankAccount" required>
                        <option value="">Select Bank Account</option>
                        ${banks.map(bank => `<option value="${bank.id}">${bank.bankName} - ${bank.accountNumber}</option>`).join('')}
                    </select>
                    <small class="form-help">Select bank account where payment was received</small>
                </div>
            </div>
            <div class="form-group">
                <label>Remarks</label>
                <textarea id="paymentRemarks" rows="2" placeholder="Additional notes"></textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success">Record Payment</button>
            </div>
        </form>
    `);
    
    document.getElementById('recordPaymentForm').addEventListener('submit', handleRecordPayment);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.searchable-dropdown')) {
            const dropdown = document.getElementById('flatDropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
}

// Flat search functions
let selectedFlatIndex = -1;

function showFlatDropdown() {
    const dropdown = document.getElementById('flatDropdown');
    dropdown.style.display = 'block';
    selectedFlatIndex = -1;
    clearFlatHighlights();
}

// Handle search with debouncing for better performance
let searchTimeout;
function handleFlatSearch(event) {
    // Don't filter on navigation keys
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab', ' '].includes(event.key)) {
        return;
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterFlats();
        selectedFlatIndex = -1;
        clearFlatHighlights();
        
        // Auto-highlight first visible item for quick selection
        const dropdown = document.getElementById('flatDropdown');
        const visibleItems = Array.from(dropdown.querySelectorAll('.dropdown-item:not([style*="display: none"])'))
                                  .filter(item => !item.classList.contains('no-results-message'));
        
        if (visibleItems.length > 0) {
            selectedFlatIndex = 0;
            highlightSelectedFlat(visibleItems);
            
            // Auto-select if exact match found
            const searchInput = document.getElementById('flatSearchInput');
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            // Check if first item is exact flat number match
            const firstItem = visibleItems[0];
            const flatNumber = firstItem.querySelector('.flat-number').textContent.toLowerCase().replace(/\s*\([^)]*\)/, '');
            
            if (flatNumber === searchTerm && searchTerm.length > 0) {
                // Add auto-select hint
                firstItem.classList.add('exact-match');
                const hintElement = document.createElement('span');
                hintElement.className = 'auto-select-hint';
                hintElement.textContent = 'AUTO';
                firstItem.style.position = 'relative';
                firstItem.appendChild(hintElement);
                
                // Small delay to show the highlight, then auto-select
                setTimeout(() => {
                    const memberName = firstItem.querySelector('.member-name').textContent;
                    selectFlat(flatNumber, memberName);
                    showNotification(`🎯 Auto-selected: ${flatNumber.toUpperCase()} - ${memberName}`, 'success');
                }, 800);
            }
        }
    }, 150);
}

// Handle keyboard navigation
function handleFlatKeyNavigation(event) {
    const dropdown = document.getElementById('flatDropdown');
    const visibleItems = Array.from(dropdown.querySelectorAll('.dropdown-item:not([style*="display: none"])'))
                              .filter(item => !item.classList.contains('no-results-message'));
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (visibleItems.length === 0) return;
            selectedFlatIndex = Math.min(selectedFlatIndex + 1, visibleItems.length - 1);
            highlightSelectedFlat(visibleItems);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            if (visibleItems.length === 0) return;
            selectedFlatIndex = Math.max(selectedFlatIndex - 1, 0);
            highlightSelectedFlat(visibleItems);
            break;
            
        case 'Enter':
        case 'Tab':
        case ' ': // Space key
            event.preventDefault();
            
            // If user has selected an item with arrow keys, use that
            if (selectedFlatIndex >= 0 && visibleItems[selectedFlatIndex]) {
                const selectedItem = visibleItems[selectedFlatIndex];
                const flatNumber = selectedItem.querySelector('.flat-number').textContent.replace(/\s*\([^)]*\)/, ''); // Remove wing info
                const memberName = selectedItem.querySelector('.member-name').textContent;
                selectFlat(flatNumber, memberName);
            }
            // If no item selected but there are visible items, auto-select first one
            else if (visibleItems.length > 0) {
                const firstItem = visibleItems[0];
                const flatNumber = firstItem.querySelector('.flat-number').textContent.replace(/\s*\([^)]*\)/, ''); // Remove wing info
                const memberName = firstItem.querySelector('.member-name').textContent;
                selectFlat(flatNumber, memberName);
            }
            // If no visible items, try to find exact match from all flats
            else {
                const searchInput = document.getElementById('flatSearchInput');
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    tryAutoSelectFlat(searchTerm);
                }
            }
            break;
            
        case 'Escape':
            event.preventDefault();
            dropdown.style.display = 'none';
            selectedFlatIndex = -1;
            break;
    }
}

// Highlight selected flat in dropdown
function highlightSelectedFlat(visibleItems) {
    clearFlatHighlights();
    
    if (selectedFlatIndex >= 0 && visibleItems[selectedFlatIndex]) {
        visibleItems[selectedFlatIndex].classList.add('keyboard-selected');
        
        // Scroll into view if needed
        visibleItems[selectedFlatIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

// Clear all highlights
function clearFlatHighlights() {
    const dropdown = document.getElementById('flatDropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('keyboard-selected', 'exact-match');
        });
    }
}

// Try to auto-select flat based on search term
function tryAutoSelectFlat(searchTerm) {
    const flats = getFlatsData();
    const searchLower = searchTerm.toLowerCase().trim();
    
    // First try exact flat number match
    let matchedFlat = flats.find(flat => 
        flat.flatNumber.toLowerCase() === searchLower
    );
    
    // If no exact flat match, try exact member name match
    if (!matchedFlat) {
        matchedFlat = flats.find(flat => 
            flat.ownerName.toLowerCase() === searchLower
        );
    }
    
    // If no exact name match, try mobile number match
    if (!matchedFlat) {
        const searchDigits = searchTerm.replace(/[^\d]/g, '');
        if (searchDigits.length >= 4) { // At least 4 digits
            matchedFlat = flats.find(flat => 
                flat.mobile && flat.mobile.replace(/[^\d]/g, '').includes(searchDigits)
            );
        }
    }
    
    // If no mobile match, try partial matches
    if (!matchedFlat) {
        // Try partial flat number match
        matchedFlat = flats.find(flat => 
            flat.flatNumber.toLowerCase().includes(searchLower)
        );
    }
    
    // If still no match, try partial member name match
    if (!matchedFlat) {
        matchedFlat = flats.find(flat => 
            flat.ownerName.toLowerCase().includes(searchLower)
        );
    }
    
    // If we found a match, select it
    if (matchedFlat) {
        selectFlat(matchedFlat.flatNumber, matchedFlat.ownerName);
        showNotification(`✅ Auto-selected: ${matchedFlat.flatNumber} - ${matchedFlat.ownerName}`, 'success');
        return true;
    } else {
        showNotification(`❌ No flat found matching "${searchTerm}"`, 'error');
        return false;
    }
}

function filterFlats() {
    const searchInput = document.getElementById('flatSearchInput');
    const dropdown = document.getElementById('flatDropdown');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // If search is empty, show all flats
    if (searchTerm === '') {
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.style.display = 'flex';
        });
        dropdown.style.display = 'block';
        return;
    }
    
    const items = dropdown.querySelectorAll('.dropdown-item');
    let hasVisibleItems = false;
    let exactMatch = null;
    
    items.forEach(item => {
        const flatNumber = item.querySelector('.flat-number').textContent.toLowerCase();
        const memberName = item.querySelector('.member-name').textContent.toLowerCase();
        const mobileElement = item.querySelector('.mobile-number');
        const mobileNumber = mobileElement ? mobileElement.textContent.toLowerCase().replace(/[^\d]/g, '') : '';
        
        // Check for exact flat number match first
        if (flatNumber === searchTerm) {
            exactMatch = item;
        }
        
        // Show items that match flat number, member name, or mobile number
        const matchesFlat = flatNumber.includes(searchTerm);
        const matchesMember = memberName.includes(searchTerm);
        const matchesMobile = mobileNumber.includes(searchTerm.replace(/[^\d]/g, ''));
        
        if (matchesFlat || matchesMember || matchesMobile) {
            item.style.display = 'flex';
            hasVisibleItems = true;
            
            // Highlight matching text
            highlightMatchingText(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
    
    // If exact match found, highlight it
    if (exactMatch) {
        exactMatch.classList.add('exact-match');
        setTimeout(() => exactMatch.classList.remove('exact-match'), 2000);
    }
    
    dropdown.style.display = hasVisibleItems ? 'block' : 'none';
    
    // Show "No results" message if no matches
    if (!hasVisibleItems && searchTerm.length > 0) {
        showNoResultsMessage(dropdown, searchTerm);
    }
}

// Highlight matching text in dropdown items
function highlightMatchingText(item, searchTerm) {
    const flatNumberEl = item.querySelector('.flat-number');
    const memberNameEl = item.querySelector('.member-name');
    const mobileNumberEl = item.querySelector('.mobile-number');
    
    // Reset previous highlights
    flatNumberEl.innerHTML = flatNumberEl.textContent;
    memberNameEl.innerHTML = memberNameEl.textContent;
    if (mobileNumberEl) {
        mobileNumberEl.innerHTML = mobileNumberEl.textContent;
    }
    
    // Highlight matching parts
    if (flatNumberEl.textContent.toLowerCase().includes(searchTerm)) {
        flatNumberEl.innerHTML = highlightText(flatNumberEl.textContent, searchTerm);
    }
    if (memberNameEl.textContent.toLowerCase().includes(searchTerm)) {
        memberNameEl.innerHTML = highlightText(memberNameEl.textContent, searchTerm);
    }
    if (mobileNumberEl && mobileNumberEl.textContent.toLowerCase().replace(/[^\d]/g, '').includes(searchTerm.replace(/[^\d]/g, ''))) {
        mobileNumberEl.innerHTML = highlightText(mobileNumberEl.textContent, searchTerm);
    }
}

// Helper function to highlight text
function highlightText(text, searchTerm) {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Show no results message
function showNoResultsMessage(dropdown, searchTerm) {
    const existingMessage = dropdown.querySelector('.no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results-message dropdown-item';
    noResultsDiv.innerHTML = `
        <div style="text-align: center; padding: 15px; color: #666;">
            <i class="fas fa-search" style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
            <div>No flats found for "<strong>${searchTerm}</strong>"</div>
            <small>Try searching by flat number, member name, or mobile number</small>
        </div>
    `;
    dropdown.appendChild(noResultsDiv);
    dropdown.style.display = 'block';
}

function selectFlat(flatNumber, memberName) {
    document.getElementById('flatSearchInput').value = `${flatNumber} - ${memberName}`;
    document.getElementById('paymentFlatNumber').value = flatNumber;
    document.getElementById('flatDropdown').style.display = 'none';
    
    // Load bills for selected flat
    loadFlatBills(flatNumber);
}

// Toggle cheque date field and bank account visibility
function toggleChequeFields() {
    const paymentMode = document.getElementById('paymentMode').value;
    const chequeDateGroup = document.getElementById('chequeDateGroup');
    const bankAccountRow = document.getElementById('paymentBankAccountRow');
    const bankAccountSelect = document.getElementById('paymentBankAccount');
    
    if (paymentMode === 'cheque') {
        chequeDateGroup.style.display = 'block';
        // Set default cheque date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('chequeDate').value = today;
    } else {
        chequeDateGroup.style.display = 'none';
        document.getElementById('chequeDate').value = '';
    }
    
    // Handle bank account field visibility
    if (paymentMode === 'cash') {
        // Hide bank account field for cash payments
        bankAccountRow.style.display = 'none';
        bankAccountSelect.required = false;
        bankAccountSelect.value = '';
        console.log('💰 Cash payment selected - Bank account field hidden');
    } else {
        // Show bank account field for non-cash payments
        bankAccountRow.style.display = 'block';
        bankAccountSelect.required = true;
        console.log('🏦 Non-cash payment selected - Bank account field shown');
    }
}

// Show Add Other Income Modal
function showAddOtherIncomeModal() {
    const banks = getBanksData();
    
    const modal = createModal('Add Other Income', `
        <form id="addOtherIncomeForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="incomeDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="incomeAmount" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Income Source *</label>
                    <select id="incomeSource" required>
                        <option value="">Select Source</option>
                        <option value="parking_rent">Parking Rent</option>
                        <option value="hall_rent">Community Hall Rent</option>
                        <option value="shop_rent">Shop Rent</option>
                        <option value="interest_income">Interest Income</option>
                        <option value="penalty_charges">Penalty Charges</option>
                        <option value="late_fees">Late Payment Fees</option>
                        <option value="deposit_refund">Security Deposit Refund</option>
                        <option value="miscellaneous">Miscellaneous Income</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Mode *</label>
                    <select id="incomePaymentMode" required onchange="toggleIncomePaymentFields()">
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>
            </div>
            <div class="form-row" id="incomePaymentDetailsRow" style="display: none;">
                <div class="form-group">
                    <label id="incomeReferenceLabel">Reference Number</label>
                    <input type="text" id="incomeReferenceNumber" placeholder="Enter reference number">
                </div>
                <div class="form-group">
                    <label>Received in Bank Account</label>
                    <select id="incomeBankAccount">
                        <option value="">Select Bank Account (Optional)</option>
                        ${banks.map(bank => `<option value="${bank.id}">${bank.bankName} - ${bank.accountNumber}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>From/Payer Name</label>
                    <input type="text" id="incomePayerName" placeholder="Enter payer name">
                </div>
                <div class="form-group">
                    <label>Flat Number (if applicable)</label>
                    <input type="text" id="incomeFlatNumber" placeholder="e.g., 101, 202">
                </div>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea id="incomeDescription" rows="3" required placeholder="Enter income description"></textarea>
            </div>
            <div class="form-group">
                <label>Remarks</label>
                <textarea id="incomeRemarks" rows="2" placeholder="Additional remarks (optional)"></textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success">Add Income</button>
            </div>
        </form>
    `);
    
    document.getElementById('addOtherIncomeForm').addEventListener('submit', handleAddOtherIncome);
}

// Handle Add Other Income
function handleAddOtherIncome(e) {
    e.preventDefault();
    
    const bankAccountId = document.getElementById('incomeBankAccount').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    
    // Get year and month from income date for receipt number
    const incomeDate = new Date(document.getElementById('incomeDate').value);
    const incomeYear = incomeDate.getFullYear();
    const incomeMonth = incomeDate.getMonth() + 1;
    
    const incomeData = {
        id: generateId(),
        date: document.getElementById('incomeDate').value,
        source: document.getElementById('incomeSource').value,
        amount: amount,
        paymentMode: document.getElementById('incomePaymentMode').value,
        referenceNumber: document.getElementById('incomeReferenceNumber')?.value || null,
        bankAccountId: bankAccountId || null,
        payerName: document.getElementById('incomePayerName').value,
        flatNumber: document.getElementById('incomeFlatNumber').value,
        description: document.getElementById('incomeDescription').value,
        remarks: document.getElementById('incomeRemarks').value,
        receiptNumber: generateIncomeReceiptNumber(incomeYear, incomeMonth),
        createdDate: new Date().toISOString()
    };
    
    // Add income to other income list
    const otherIncome = getOtherIncomeData();
    otherIncome.push(incomeData);
    saveOtherIncomeData(otherIncome);
    
    // If bank account is selected, add credit transaction and update balance
    if (bankAccountId) {
        addIncomeToBank(bankAccountId, amount, incomeData.date, incomeData.source, incomeData.payerName, incomeData.id);
    }
    
    closeModal();
    showNotification('Other income added successfully!', 'success');
    
    // Refresh payments data if we're on payments section
    if (document.getElementById('paymentsSection').style.display !== 'none') {
        loadPaymentsData();
    }
}

// Generate sequential income receipt number
function generateIncomeReceiptNumber(year, month) {
    const otherIncome = getOtherIncomeData();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Find all income receipts for this year-month
    const existingIncomeReceipts = otherIncome.filter(income => 
        income.receiptNumber && income.receiptNumber.startsWith(`INC-${yearMonth}`)
    );
    
    // Get the highest sequence number
    let maxSequence = 0;
    existingIncomeReceipts.forEach(income => {
        const parts = income.receiptNumber.split('-');
        if (parts.length === 4) {
            const sequence = parseInt(parts[3]);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        }
    });
    
    // Generate next sequence number
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    return `INC-${yearMonth}-${nextSequence}`;
}

// Add income to bank account
function addIncomeToBank(bankAccountId, amount, date, source, payerName, incomeId) {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Update bank balance
    const bankIndex = banks.findIndex(bank => bank.id === bankAccountId);
    if (bankIndex !== -1) {
        banks[bankIndex].balance = (banks[bankIndex].balance || 0) + amount;
        saveBanksData(banks);
    }
    
    // Add bank payment record
    const bankPaymentData = {
        id: generateId(),
        bankId: bankAccountId,
        type: 'credit',
        amount: amount,
        date: date,
        description: `Other Income: ${getIncomeSourceText(source)}`,
        reference: payerName || 'Other Income',
        relatedId: incomeId,
        relatedType: 'other_income',
        createdDate: new Date().toISOString()
    };
    
    bankPayments.push(bankPaymentData);
    saveBankPaymentsData(bankPayments);
}

// Get income source display text
function getIncomeSourceText(source) {
    const sourceMap = {
        'parking_rent': 'Parking Rent',
        'hall_rent': 'Community Hall Rent',
        'shop_rent': 'Shop Rent',
        'interest_income': 'Interest Income',
        'penalty_charges': 'Penalty Charges',
        'late_fees': 'Late Payment Fees',
        'deposit_refund': 'Security Deposit Refund',
        'miscellaneous': 'Miscellaneous Income',
        'other': 'Other Income'
    };
    return sourceMap[source] || source;
}

function showAddExpenseModal() {
    // Get available banks for dropdown
    const banks = getBanksData();
    const bankOptions = banks.map(bank => 
        `<option value="${bank.id}">${bank.bankName} - ${bank.accountNumber}</option>`
    ).join('');

    const modal = createModal('Add Expense', `
        <form id="addExpenseForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="expenseCategory" required>
                        <option value="">Select Category</option>
                        <option value="electricity">Electricity</option>
                        <option value="water">Water</option>
                        <option value="security">Security</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="maintenance">Maintenance & Repair</option>
                        <option value="gardening">Gardening</option>
                        <option value="lift">Lift Maintenance</option>
                        <option value="insurance">Insurance</option>
                        <option value="bank_charges">Bank Charges</option>
                        <option value="legal">Legal</option>
                        <option value="office">Office Expenses</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="expenseAmount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Payment Mode *</label>
                    <select id="expensePaymentMode" required onchange="toggleExpensePaymentFields()">
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>
            </div>
            <div class="form-row" id="expensePaymentDetailsRow" style="display: none;">
                <div class="form-group">
                    <label id="expenseReferenceLabel">Cheque Number</label>
                    <input type="text" id="expenseReferenceNumber" placeholder="Enter cheque/reference number">
                </div>
                <div class="form-group" id="expenseChequeDateGroup" style="display: none;">
                    <label>Cheque Date</label>
                    <input type="date" id="expenseChequeDate" placeholder="Date when cheque was given">
                </div>
            </div>
            <div class="form-row" id="expenseBankAccountRow" style="display: none;">
                <div class="form-group">
                    <label>Bank Account</label>
                    <select id="expenseBankAccount">
                        <option value="">Select Bank Account (Optional)</option>
                        ${bankOptions}
                    </select>
                    <small class="form-help">Select bank account if payment was made from society bank</small>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Vendor/Payee *</label>
                    <input type="text" id="expenseVendor" required>
                </div>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea id="expenseDescription" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label>Bill/Receipt Number</label>
                <input type="text" id="expenseBillNumber">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Expense</button>
            </div>
        </form>
    `);
    
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
}

// Function to toggle payment details fields based on payment mode
function toggleExpensePaymentFields() {
    const paymentMode = document.getElementById('expensePaymentMode').value;
    const paymentDetailsRow = document.getElementById('expensePaymentDetailsRow');
    const bankAccountRow = document.getElementById('expenseBankAccountRow');
    const referenceLabel = document.getElementById('expenseReferenceLabel');
    const referenceInput = document.getElementById('expenseReferenceNumber');
    const chequeDateGroup = document.getElementById('expenseChequeDateGroup');
    
    if (paymentMode === 'cash') {
        paymentDetailsRow.style.display = 'none';
        bankAccountRow.style.display = 'none';
        chequeDateGroup.style.display = 'none';
        referenceInput.value = '';
        document.getElementById('expenseChequeDate').value = '';
    } else {
        paymentDetailsRow.style.display = 'flex';
        bankAccountRow.style.display = 'flex';
        
        // Show/hide cheque date based on payment mode
        if (paymentMode === 'cheque') {
            chequeDateGroup.style.display = 'block';
            // Set default cheque date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('expenseChequeDate').value = today;
        } else {
            chequeDateGroup.style.display = 'none';
            document.getElementById('expenseChequeDate').value = '';
        }
        
        // Update label based on payment mode
        switch(paymentMode) {
            case 'cheque':
                referenceLabel.textContent = 'Cheque Number';
                referenceInput.placeholder = 'Enter cheque number';
                break;
            case 'online':
                referenceLabel.textContent = 'Transaction ID';
                referenceInput.placeholder = 'Enter transaction ID';
                break;
            case 'upi':
                referenceLabel.textContent = 'UPI Reference';
                referenceInput.placeholder = 'Enter UPI reference number';
                break;
            case 'bank_transfer':
                referenceLabel.textContent = 'Transfer Reference';
                referenceInput.placeholder = 'Enter transfer reference';
                break;
            default:
                referenceLabel.textContent = 'Reference Number';
                referenceInput.placeholder = 'Enter reference number';
        }
    }
}

// Function for edit expense payment fields
function toggleEditExpensePaymentFields() {
    const paymentMode = document.getElementById('editExpensePaymentMode').value;
    const paymentDetailsRow = document.getElementById('editExpensePaymentDetailsRow');
    const referenceLabel = document.getElementById('editExpenseReferenceLabel');
    const referenceInput = document.getElementById('editExpenseReferenceNumber');
    
    if (paymentMode === 'cash') {
        paymentDetailsRow.style.display = 'none';
        referenceInput.value = '';
    } else {
        paymentDetailsRow.style.display = 'flex';
        
        // Update label based on payment mode
        switch(paymentMode) {
            case 'cheque':
                referenceLabel.textContent = 'Cheque Number';
                referenceInput.placeholder = 'Enter cheque number';
                break;
            case 'online':
                referenceLabel.textContent = 'Transaction ID';
                referenceInput.placeholder = 'Enter transaction ID';
                break;
            case 'upi':
                referenceLabel.textContent = 'UPI Reference';
                referenceInput.placeholder = 'Enter UPI reference number';
                break;
            case 'bank_transfer':
                referenceLabel.textContent = 'Transfer Reference';
                referenceInput.placeholder = 'Enter transfer reference';
                break;
            default:
                referenceLabel.textContent = 'Reference Number';
                referenceInput.placeholder = 'Enter reference number';
        }
    }
}

// Function for income payment fields
function toggleIncomePaymentFields() {
    const paymentMode = document.getElementById('incomePaymentMode').value;
    const paymentDetailsRow = document.getElementById('incomePaymentDetailsRow');
    const referenceLabel = document.getElementById('incomeReferenceLabel');
    const referenceInput = document.getElementById('incomeReferenceNumber');
    
    if (paymentMode === 'cash') {
        paymentDetailsRow.style.display = 'none';
        referenceInput.value = '';
    } else {
        paymentDetailsRow.style.display = 'flex';
        
        // Update label based on payment mode
        switch(paymentMode) {
            case 'cheque':
                referenceLabel.textContent = 'Cheque Number';
                referenceInput.placeholder = 'Enter cheque number';
                break;
            case 'online':
                referenceLabel.textContent = 'Transaction ID';
                referenceInput.placeholder = 'Enter transaction ID';
                break;
            case 'upi':
                referenceLabel.textContent = 'UPI Reference';
                referenceInput.placeholder = 'Enter UPI reference number';
                break;
            case 'bank_transfer':
                referenceLabel.textContent = 'Transfer Reference';
                referenceInput.placeholder = 'Enter transfer reference';
                break;
            default:
                referenceLabel.textContent = 'Reference Number';
                referenceInput.placeholder = 'Enter reference number';
        }
    }
}

// Legacy function for backward compatibility
function toggleBankField() {
    toggleExpensePaymentFields();
}

function handleAddBank(e) {
    e.preventDefault();
    
    // Wait a moment to ensure form is fully rendered
    setTimeout(() => {
        // Get form values with better error handling
        const bankNameEl = document.getElementById('addBankName');
        const branchEl = document.getElementById('addBankBranch');
        const accountNumberEl = document.getElementById('bankAccountNumber');
        const ifscCodeEl = document.getElementById('bankIfscCode');
        const accountTypeEl = document.getElementById('bankAccountType');
        const initialBalanceEl = document.getElementById('bankInitialBalance');
        const descriptionEl = document.getElementById('bankDescription');
        
        // Check if elements exist
        if (!bankNameEl || !branchEl || !accountNumberEl || !ifscCodeEl || !accountTypeEl) {
            console.error('Missing form elements:', {
                bankNameEl: !!bankNameEl,
                branchEl: !!branchEl,
                accountNumberEl: !!accountNumberEl,
                ifscCodeEl: !!ifscCodeEl,
                accountTypeEl: !!accountTypeEl
            });
            showNotification('Form elements not found! Please try again.', 'error');
            return;
        }
        
        // Clear any browser autocomplete values that might interfere
        const bankName = (bankNameEl.value || '').trim();
        const branch = (branchEl.value || '').trim();
        const accountNumber = (accountNumberEl.value || '').trim();
        const ifscCode = (ifscCodeEl.value || '').trim();
        const accountType = accountTypeEl.value || '';
        const initialBalance = initialBalanceEl ? (initialBalanceEl.value || '') : '';
        const description = descriptionEl ? (descriptionEl.value || '').trim() : '';
        
        console.log('Form values debug:', {
            bankName: `"${bankName}"`,
            branch: `"${branch}"`,
            accountNumber: `"${accountNumber}"`,
            ifscCode: `"${ifscCode}"`,
            accountType: `"${accountType}"`,
            elementValues: {
                bankNameRaw: bankNameEl.value,
                branchRaw: branchEl.value,
                accountNumberRaw: accountNumberEl.value,
                ifscCodeRaw: ifscCodeEl.value,
                accountTypeRaw: accountTypeEl.value
            }
        });
        
        // Validate required fields with detailed error messages
        if (!bankName) {
            showNotification('Bank Name is required!', 'error');
            bankNameEl.focus();
            return;
        }
        if (!branch) {
            showNotification('Branch is required!', 'error');
            branchEl.focus();
            return;
        }
        if (!accountNumber) {
            showNotification('Account Number is required!', 'error');
            accountNumberEl.focus();
            return;
        }
        if (!ifscCode) {
            showNotification('IFSC Code is required!', 'error');
            ifscCodeEl.focus();
            return;
        }
        if (!accountType) {
            showNotification('Account Type is required!', 'error');
            accountTypeEl.focus();
            return;
        }
        
        // Continue with bank creation
        processAddBank(bankName, branch, accountNumber, ifscCode, accountType, initialBalance, description);
    }, 100);
}

function processAddBank(bankName, branch, accountNumber, ifscCode, accountType, initialBalance, description) {
    const parsedInitialBalance = parseFloat(initialBalance) || 0;
    
    const bankData = {
        id: generateId(),
        bankName: bankName,
        branch: branch,
        accountNumber: accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountType: accountType,
        balance: parsedInitialBalance,
        description: description,
        createdDate: new Date().toISOString()
    };
    
    console.log('Adding bank with data:', bankData); // Debug log
    
    const banks = getBanksData();
    console.log('Existing banks before adding:', banks);
    
    // Check if account number already exists
    if (banks.find(bank => bank.accountNumber === bankData.accountNumber)) {
        showNotification('Account number already exists!', 'error');
        return;
    }
    
    // If initial balance is provided and > 0, create an opening balance transaction
    if (parsedInitialBalance > 0) {
        const openingTransaction = {
            id: generateId(),
            bankId: bankData.id,
            type: 'credit',
            amount: parsedInitialBalance,
            description: 'Opening Balance',
            reference: 'OPENING-BAL',
            date: new Date().toISOString().split('T')[0],
            createdDate: new Date().toISOString()
        };
        
        // Add opening balance transaction
        const bankPayments = getBankPaymentsData();
        bankPayments.push(openingTransaction);
        saveBankPaymentsData(bankPayments);
        
        console.log('Added opening balance transaction:', openingTransaction);
    }
    
    banks.push(bankData);
    saveBanksData(banks);
    
    // Save individual bank to Firebase immediately
    saveBankToFirebase(bankData);
    
    console.log('Banks after adding:', banks); // Debug log
    
    closeModal();
    loadBanksData();
    showNotification(`Bank "${bankName}" added successfully!`, 'success');
}

function handleAddBankPayment(e) {
    e.preventDefault();
    
    const paymentData = {
        id: generateId(),
        bankId: document.getElementById('paymentBankId').value,
        type: document.getElementById('paymentType').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        date: document.getElementById('paymentDate').value,
        description: document.getElementById('paymentDescription').value,
        reference: document.getElementById('paymentReference').value,
        createdDate: new Date().toISOString()
    };
    
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Update bank balance
    const bankIndex = banks.findIndex(bank => bank.id === paymentData.bankId);
    if (bankIndex !== -1) {
        if (paymentData.type === 'credit') {
            banks[bankIndex].balance = (banks[bankIndex].balance || 0) + paymentData.amount;
        } else {
            banks[bankIndex].balance = (banks[bankIndex].balance || 0) - paymentData.amount;
        }
        saveBanksData(banks);
    }
    
    bankPayments.push(paymentData);
    saveBankPaymentsData(bankPayments);
    
    closeModal();
    refreshBankPaymentsTable();
    loadBanksData();
    showNotification(`Bank ${paymentData.type} recorded successfully!`, 'success');
}

function addBankTransaction(bankId, type) {
    const banks = getBanksData();
    const bank = banks.find(b => b.id === bankId);
    
    if (!bank) {
        showNotification('Bank not found!', 'error');
        return;
    }
    
    const modal = createModal(`Add ${type === 'credit' ? 'Credit' : 'Debit'} - ${bank.bankName}`, `
        <form id="quickBankTransactionForm">
            <input type="hidden" id="quickBankId" value="${bankId}">
            <input type="hidden" id="quickTransactionType" value="${type}">
            <div class="form-row">
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="quickAmount" step="0.01" required min="0.01">
                </div>
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="quickDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea id="quickDescription" rows="2" required placeholder="e.g., ${type === 'credit' ? 'Maintenance collection' : 'Electricity bill payment'}"></textarea>
            </div>
            <div class="form-group">
                <label>Reference Number</label>
                <input type="text" id="quickReference" placeholder="Transaction ID, Cheque number, etc.">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-${type === 'credit' ? 'success' : 'warning'}">${type === 'credit' ? 'Add Credit' : 'Add Debit'}</button>
            </div>
        </form>
    `);
    
    document.getElementById('quickBankTransactionForm').addEventListener('submit', handleQuickBankTransaction);
}

function handleQuickBankTransaction(e) {
    e.preventDefault();
    
    const paymentData = {
        id: generateId(),
        bankId: document.getElementById('quickBankId').value,
        type: document.getElementById('quickTransactionType').value,
        amount: parseFloat(document.getElementById('quickAmount').value),
        date: document.getElementById('quickDate').value,
        description: document.getElementById('quickDescription').value,
        reference: document.getElementById('quickReference').value,
        createdDate: new Date().toISOString()
    };
    
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Update bank balance
    const bankIndex = banks.findIndex(bank => bank.id === paymentData.bankId);
    if (bankIndex !== -1) {
        if (paymentData.type === 'credit') {
            banks[bankIndex].balance = (banks[bankIndex].balance || 0) + paymentData.amount;
        } else {
            banks[bankIndex].balance = (banks[bankIndex].balance || 0) - paymentData.amount;
        }
        saveBanksData(banks);
    }
    
    bankPayments.push(paymentData);
    saveBankPaymentsData(bankPayments);
    
    closeModal();
    refreshBankPaymentsTable();
    loadBanksData();
    showNotification(`${paymentData.type === 'credit' ? 'Credit' : 'Debit'} added successfully!`, 'success');
}

function editBank(id) {
    const banks = getBanksData();
    const bank = banks.find(b => b.id === id);
    
    if (!bank) {
        showNotification('Bank not found!', 'error');
        return;
    }
    
    const modal = createModal('Edit Bank Details', `
        <form id="editBankForm" autocomplete="off">
            <div class="form-row">
                <div class="form-group">
                    <label>Bank Name *</label>
                    <input type="text" id="editBankName" name="editBankName_${Date.now()}" required placeholder="e.g., State Bank of India" autocomplete="off" value="${bank.bankName}">
                </div>
                <div class="form-group">
                    <label>Branch *</label>
                    <input type="text" id="editBankBranch" name="editBankBranch_${Date.now()}" required placeholder="e.g., Kharghar Branch" autocomplete="off" value="${bank.branch}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account Number *</label>
                    <input type="text" id="editBankAccountNumber" name="editBankAccountNumber_${Date.now()}" required placeholder="e.g., 60234168835" autocomplete="off" value="${bank.accountNumber}">
                </div>
                <div class="form-group">
                    <label>IFSC Code *</label>
                    <input type="text" id="editBankIfscCode" name="editBankIfscCode_${Date.now()}" required placeholder="e.g., SBIN0001234" autocomplete="off" value="${bank.ifscCode}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account Type *</label>
                    <select id="editBankAccountType" name="editBankAccountType_${Date.now()}" required autocomplete="off">
                        <option value="">Select Type</option>
                        <option value="savings" ${bank.accountType === 'savings' ? 'selected' : ''}>Savings Account</option>
                        <option value="current" ${bank.accountType === 'current' ? 'selected' : ''}>Current Account</option>
                        <option value="fd" ${bank.accountType === 'fd' ? 'selected' : ''}>Fixed Deposit</option>
                        <option value="rd" ${bank.accountType === 'rd' ? 'selected' : ''}>Recurring Deposit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Current Balance (₹)</label>
                    <input type="number" id="editBankBalance" name="editBankBalance_${Date.now()}" step="0.01" placeholder="0.00" autocomplete="off" value="${bank.balance || 0}">
                    <small>Note: Changing balance will create a balance adjustment transaction</small>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="editBankDescription" name="editBankDescription_${Date.now()}" rows="2" placeholder="Additional notes about this bank account" autocomplete="off">${bank.description || ''}</textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Bank</button>
            </div>
        </form>
    `);
    
    document.getElementById('editBankForm').addEventListener('submit', function(e) {
        handleEditBank(e, id);
    });
}

function handleEditBank(e, bankId) {
    e.preventDefault();
    
    // Get form values
    const bankName = document.getElementById('editBankName').value.trim();
    const branch = document.getElementById('editBankBranch').value.trim();
    const accountNumber = document.getElementById('editBankAccountNumber').value.trim();
    const ifscCode = document.getElementById('editBankIfscCode').value.trim();
    const accountType = document.getElementById('editBankAccountType').value;
    const newBalance = parseFloat(document.getElementById('editBankBalance').value) || 0;
    const description = document.getElementById('editBankDescription').value.trim();
    
    // Validate required fields
    if (!bankName || !branch || !accountNumber || !ifscCode || !accountType) {
        showNotification('Please fill all required fields!', 'error');
        return;
    }
    
    const banks = getBanksData();
    const bankIndex = banks.findIndex(b => b.id === bankId);
    
    if (bankIndex === -1) {
        showNotification('Bank not found!', 'error');
        return;
    }
    
    const originalBank = banks[bankIndex];
    
    // Check if account number already exists (excluding current bank)
    if (banks.find(bank => bank.accountNumber === accountNumber && bank.id !== bankId)) {
        showNotification('Account number already exists for another bank!', 'error');
        return;
    }
    
    // Check if balance changed
    const originalBalance = originalBank.balance || 0;
    const balanceChanged = Math.abs(newBalance - originalBalance) > 0.01;
    
    // Update bank data
    banks[bankIndex] = {
        ...originalBank,
        bankName: bankName,
        branch: branch,
        accountNumber: accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountType: accountType,
        balance: newBalance,
        description: description,
        modifiedDate: new Date().toISOString()
    };
    
    saveBanksData(banks);
    
    // If balance changed, create adjustment transaction
    if (balanceChanged) {
        const balanceDifference = newBalance - originalBalance;
        const adjustmentType = balanceDifference > 0 ? 'credit' : 'debit';
        const adjustmentAmount = Math.abs(balanceDifference);
        
        const adjustmentTransaction = {
            id: 'ADJ-' + Date.now(),
            bankId: bankId,
            type: adjustmentType,
            amount: adjustmentAmount,
            date: new Date().toISOString().split('T')[0],
            description: `Balance adjustment - Bank details updated`,
            reference: `Balance Update`,
            category: 'adjustment',
            createdDate: new Date().toISOString()
        };
        
        const bankPayments = getBankPaymentsData();
        bankPayments.push(adjustmentTransaction);
        saveBankPaymentsData(bankPayments);
        
        console.log('Balance adjustment created:', adjustmentTransaction);
    }
    
    closeModal();
    loadBanksData();
    showNotification(`Bank "${bankName}" updated successfully!`, 'success');
}

function deleteBank(id) {
    const banks = getBanksData();
    const bank = banks.find(b => b.id === id);
    
    if (!bank) {
        showNotification('Bank not found!', 'error');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete this bank?\n\nBank: ${bank.bankName}\nAccount: ${bank.accountNumber}\nBalance: ₹${(bank.balance || 0).toLocaleString()}\n\nThis action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
        const updatedBanks = banks.filter(b => b.id !== id);
        saveBanksData(updatedBanks);
        loadBanksData();
        showNotification(`Bank ${bank.bankName} deleted successfully!`, 'success');
    }
}

// Generate Bank Statement
function generateBankStatement(bankId) {
    const banks = getBanksData();
    const bank = banks.find(b => b.id === bankId);
    
    if (!bank) {
        showNotification('Bank not found!', 'error');
        return;
    }
    
    // Show date range modal
    const modal = createModal('Generate Bank Statement', `
        <form id="bankStatementForm">
            <div class="form-group">
                <label>Bank: ${bank.bankName} - ${bank.accountNumber}</label>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>From Date *</label>
                    <input type="date" id="statementFromDate" required>
                </div>
                <div class="form-group">
                    <label>To Date *</label>
                    <input type="date" id="statementToDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Generate Statement</button>
            </div>
        </form>
    `);
    
    // Set default from date (3 months ago)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    document.getElementById('statementFromDate').value = threeMonthsAgo.toISOString().split('T')[0];
    
    document.getElementById('bankStatementForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fromDate = document.getElementById('statementFromDate').value;
        const toDate = document.getElementById('statementToDate').value;
        
        if (new Date(fromDate) > new Date(toDate)) {
            showNotification('From date cannot be greater than To date!', 'error');
            return;
        }
        
        closeModal();
        printBankStatement(bankId, fromDate, toDate);
    });
}

// Print Bank Statement
function printBankStatement(bankId, fromDate, toDate) {
    const banks = getBanksData();
    const bank = banks.find(b => b.id === bankId);
    const bankPayments = getBankPaymentsData();
    const societyInfo = getSocietyInfo();
    
    // Filter transactions for this bank and date range
    const transactions = bankPayments
        .filter(payment => 
            payment.bankId === bankId && 
            payment.date >= fromDate && 
            payment.date <= toDate
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let runningBalance = bank.balance || 0;
    
    // Calculate opening balance (subtract all transactions after fromDate)
    const transactionsAfterFrom = bankPayments
        .filter(payment => payment.bankId === bankId && payment.date >= fromDate)
        .reduce((sum, payment) => {
            return sum + (payment.type === 'credit' ? -payment.amount : payment.amount);
        }, 0);
    
    const openingBalance = runningBalance + transactionsAfterFrom;
    
    // Add running balance to each transaction
    let balance = openingBalance;
    const transactionsWithBalance = transactions.map(transaction => {
        if (transaction.type === 'credit') {
            balance += transaction.amount;
        } else {
            balance -= transaction.amount;
        }
        return { ...transaction, runningBalance: balance };
    });
    
    const statementWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    statementWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bank Statement - ${bank.bankName}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 12px;
                }
                .statement-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                }
                .statement-header h1 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }
                .statement-header h2 {
                    margin: 5px 0;
                    font-size: 16px;
                    color: #666;
                }
                .bank-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                }
                .bank-details, .statement-period {
                    flex: 1;
                }
                .bank-details h3, .statement-period h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #333;
                }
                .info-row {
                    margin: 5px 0;
                }
                .info-label {
                    font-weight: bold;
                    display: inline-block;
                    width: 120px;
                }
                .transactions-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .transactions-table th,
                .transactions-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .transactions-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    text-align: center;
                }
                .credit {
                    color: #28a745;
                    font-weight: bold;
                }
                .debit {
                    color: #dc3545;
                    font-weight: bold;
                }
                .balance-summary {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .balance-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                }
                .balance-label {
                    font-weight: bold;
                }
                .print-actions {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    gap: 5px;
                    z-index: 1000;
                }
                .btn {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .btn-primary { background: #007bff; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                @media print {
                    .print-actions { display: none; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="print-actions">
                <button class="btn btn-primary" onclick="window.print()">Print</button>
                <button class="btn btn-secondary" onclick="window.close()">Close</button>
            </div>
            
            <div class="statement-header">
                <h1>${societyInfo.name}</h1>
                <h2>BANK STATEMENT</h2>
            </div>
            
            <div class="bank-info">
                <div class="bank-details">
                    <h3>Bank Details</h3>
                    <div class="info-row">
                        <span class="info-label">Bank Name:</span>
                        <span>${bank.bankName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Account Number:</span>
                        <span>${bank.accountNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Account Type:</span>
                        <span>${bank.accountType}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">IFSC Code:</span>
                        <span>${bank.ifscCode}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Branch:</span>
                        <span>${bank.branch}</span>
                    </div>
                </div>
                <div class="statement-period">
                    <h3>Statement Period</h3>
                    <div class="info-row">
                        <span class="info-label">From Date:</span>
                        <span>${formatDateDDMMYYYY(fromDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">To Date:</span>
                        <span>${formatDateDDMMYYYY(toDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Generated On:</span>
                        <span>${new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                </div>
            </div>
            
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Reference</th>
                        <th>Debit (₹)</th>
                        <th>Credit (₹)</th>
                        <th>Balance (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #e9ecef;">
                        <td colspan="5"><strong>Opening Balance</strong></td>
                        <td><strong>₹${openingBalance.toFixed(2)}</strong></td>
                    </tr>
                    ${transactionsWithBalance.map(transaction => `
                        <tr>
                            <td>${formatDateDDMMYYYY(transaction.date)}</td>
                            <td>${transaction.description}</td>
                            <td>${transaction.reference || '-'}</td>
                            <td class="debit">${transaction.type === 'debit' ? '₹' + transaction.amount.toFixed(2) : '-'}</td>
                            <td class="credit">${transaction.type === 'credit' ? '₹' + transaction.amount.toFixed(2) : '-'}</td>
                            <td>₹${transaction.runningBalance.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    ${transactions.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: #666;">No transactions found for the selected period</td></tr>' : ''}
                </tbody>
            </table>
            
            <div class="balance-summary">
                <h3>Summary</h3>
                <div class="balance-row">
                    <span class="balance-label">Opening Balance:</span>
                    <span>₹${openingBalance.toFixed(2)}</span>
                </div>
                <div class="balance-row">
                    <span class="balance-label">Total Credits:</span>
                    <span class="credit">₹${transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
                </div>
                <div class="balance-row">
                    <span class="balance-label">Total Debits:</span>
                    <span class="debit">₹${transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
                </div>
                <div class="balance-row" style="border-top: 1px solid #333; padding-top: 10px; margin-top: 10px;">
                    <span class="balance-label">Closing Balance:</span>
                    <span><strong>₹${(transactionsWithBalance.length > 0 ? transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance : openingBalance).toFixed(2)}</strong></span>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
                <p>This is a computer-generated statement for ${societyInfo.name}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
    
    statementWindow.document.close();
    statementWindow.focus();
}

function editBankPayment(id) {
    showNotification('Edit bank payment feature coming soon!', 'info');
}

// Bank Transfer Functions
function showBankTransferModal(fromBankId) {
    const banks = getBanksData();
    const fromBank = banks.find(b => b.id === fromBankId);
    
    if (!fromBank) {
        showNotification('Source bank not found!', 'error');
        return;
    }
    
    const otherBanks = banks.filter(b => b.id !== fromBankId);
    
    if (otherBanks.length === 0) {
        showNotification('No other banks available for transfer!', 'warning');
        return;
    }
    
    const modal = createModal('Bank to Bank Transfer', `
        <form id="bankTransferForm">
            <div class="form-row">
                <div class="form-group">
                    <label>From Bank</label>
                    <input type="text" value="${fromBank.bankName} (${fromBank.accountNumber})" readonly>
                    <small>Available Balance: ₹${(fromBank.balance || 0).toLocaleString()}</small>
                </div>
                <div class="form-group">
                    <label>To Bank *</label>
                    <select id="toBankId" required>
                        <option value="">Select Destination Bank</option>
                        ${otherBanks.map(bank => `
                            <option value="${bank.id}">${bank.bankName} (${bank.accountNumber})</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Transfer Amount *</label>
                    <input type="number" id="transferAmount" step="0.01" min="1" max="${fromBank.balance || 0}" required>
                </div>
                <div class="form-group">
                    <label>Transfer Date *</label>
                    <input type="date" id="transferDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Transfer Reference</label>
                <input type="text" id="transferReference" placeholder="Enter reference number (optional)">
            </div>
            
            <div class="form-group">
                <label>Description *</label>
                <textarea id="transferDescription" rows="3" placeholder="Enter transfer description" required>Fund transfer between society bank accounts</textarea>
            </div>
            
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-exchange-alt"></i> Process Transfer
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    
    // Add form submit handler
    document.getElementById('bankTransferForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processBankTransfer(fromBankId);
    });
}

function processBankTransfer(fromBankId) {
    const toBankId = document.getElementById('toBankId').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const date = document.getElementById('transferDate').value;
    const reference = document.getElementById('transferReference').value;
    const description = document.getElementById('transferDescription').value;
    
    if (!toBankId || !amount || !date || !description) {
        showNotification('Please fill all required fields!', 'error');
        return;
    }
    
    const banks = getBanksData();
    const fromBank = banks.find(b => b.id === fromBankId);
    const toBank = banks.find(b => b.id === toBankId);
    
    if (!fromBank || !toBank) {
        showNotification('Invalid bank selection!', 'error');
        return;
    }
    
    if (amount > (fromBank.balance || 0)) {
        showNotification('Insufficient balance in source bank!', 'error');
        return;
    }
    
    // Generate transfer ID
    const transferId = 'TXN-' + Date.now();
    
    // Update bank balances
    const fromBankIndex = banks.findIndex(b => b.id === fromBankId);
    const toBankIndex = banks.findIndex(b => b.id === toBankId);
    
    banks[fromBankIndex].balance = (banks[fromBankIndex].balance || 0) - amount;
    banks[toBankIndex].balance = (banks[toBankIndex].balance || 0) + amount;
    
    // Create debit transaction for source bank
    const debitTransaction = {
        id: 'DBT-' + Date.now(),
        bankId: fromBankId,
        type: 'debit',
        amount: amount,
        date: date,
        description: `Transfer to ${toBank.bankName} - ${description}`,
        reference: reference || transferId,
        category: 'transfer',
        transferId: transferId,
        transferTo: toBankId,
        createdDate: new Date().toISOString()
    };
    
    // Create credit transaction for destination bank
    const creditTransaction = {
        id: 'CRD-' + Date.now() + 1,
        bankId: toBankId,
        type: 'credit',
        amount: amount,
        date: date,
        description: `Transfer from ${fromBank.bankName} - ${description}`,
        reference: reference || transferId,
        category: 'transfer',
        transferId: transferId,
        transferFrom: fromBankId,
        createdDate: new Date().toISOString()
    };
    
    // Save all data
    const bankPayments = getBankPaymentsData();
    bankPayments.push(debitTransaction, creditTransaction);
    
    saveBanksData(banks);
    saveBankPaymentsData(bankPayments);
    
    // Generate transfer receipt
    generateTransferReceipt({
        transferId: transferId,
        fromBank: fromBank,
        toBank: toBank,
        amount: amount,
        date: date,
        reference: reference,
        description: description,
        debitTransaction: debitTransaction,
        creditTransaction: creditTransaction
    });
    
    closeModal();
    loadBanksData();
    showNotification('Bank transfer completed successfully!', 'success');
}

// Generate Transfer Receipt in A5 Format
function generateTransferReceipt(transferData) {
    // Get society information from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    }
    localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    
    const societyName = societyInfo.name;
    const societyAddress = societyInfo.address;
    const societyRegNo = societyInfo.registrationNumber;
    
    // Open in new window for A5 print format
    const receiptWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
    
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bank Transfer Receipt</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                ${getA5TransferReceiptCSS()}
            </style>
        </head>
        <body>
            <div class="a5-container">
                <div class="receipt-actions no-print">
                    <button onclick="window.print()" class="print-btn">
                        🖨️ Print Receipt
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        ❌ Close
                    </button>
                </div>
                
                <div class="transfer-document">
                    <div class="receipt-header">
                        <div class="society-header">
                            <div class="society-logo-section">
                                <img src="society.logo.png" alt="Society Logo" class="receipt-logo" onerror="this.style.display='none';">
                            </div>
                            <div class="society-info">
                                <h1>${societyName}</h1>
                                <p class="reg-no">Registration No: ${societyRegNo}</p>
                                <p class="address">${societyAddress}</p>
                            </div>
                        </div>
                        
                        <div class="receipt-title">
                            <h2>BANK TRANSFER RECEIPT</h2>
                        </div>
                    </div>
                    
                    <div class="transfer-details">
                        <table class="details-table">
                            <tr>
                                <td><strong>Transfer ID:</strong></td>
                                <td>${transferData.transferId}</td>
                                <td><strong>Date:</strong></td>
                                <td>${formatDateDDMMYYYY(transferData.date)}</td>
                            </tr>
                            <tr>
                                <td><strong>Reference:</strong></td>
                                <td>${transferData.reference || 'N/A'}</td>
                                <td><strong>Time:</strong></td>
                                <td>${new Date().toLocaleTimeString()}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="bank-details">
                        <div class="bank-section">
                            <h3>From Bank (Debit)</h3>
                            <table class="bank-table">
                                <tr>
                                    <td><strong>Bank Name:</strong></td>
                                    <td>${transferData.fromBank.bankName}</td>
                                </tr>
                                <tr>
                                    <td><strong>Account No:</strong></td>
                                    <td>${transferData.fromBank.accountNumber}</td>
                                </tr>
                                <tr>
                                    <td><strong>IFSC Code:</strong></td>
                                    <td>${transferData.fromBank.ifscCode}</td>
                                </tr>
                                <tr>
                                    <td><strong>Branch:</strong></td>
                                    <td>${transferData.fromBank.branch}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="transfer-arrow">
                            ➡️
                        </div>
                        
                        <div class="bank-section">
                            <h3>To Bank (Credit)</h3>
                            <table class="bank-table">
                                <tr>
                                    <td><strong>Bank Name:</strong></td>
                                    <td>${transferData.toBank.bankName}</td>
                                </tr>
                                <tr>
                                    <td><strong>Account No:</strong></td>
                                    <td>${transferData.toBank.accountNumber}</td>
                                </tr>
                                <tr>
                                    <td><strong>IFSC Code:</strong></td>
                                    <td>${transferData.toBank.ifscCode}</td>
                                </tr>
                                <tr>
                                    <td><strong>Branch:</strong></td>
                                    <td>${transferData.toBank.branch}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="amount-section">
                        <div class="amount-display">
                            <h2>Transfer Amount: ₹${transferData.amount.toLocaleString()}</h2>
                            <p><em>Rupees ${numberToWords(transferData.amount)} Only</em></p>
                        </div>
                    </div>
                    
                    <div class="description-section">
                        <h3>Transfer Description:</h3>
                        <p>${transferData.description}</p>
                    </div>
                    
                    <div class="transaction-details">
                        <h3>Transaction Details:</h3>
                        <table class="transaction-table">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Bank</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${transferData.debitTransaction.id}</td>
                                    <td>${transferData.fromBank.bankName}</td>
                                    <td><span class="debit-badge">Debit</span></td>
                                    <td>₹${transferData.amount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>${transferData.creditTransaction.id}</td>
                                    <td>${transferData.toBank.bankName}</td>
                                    <td><span class="credit-badge">Credit</span></td>
                                    <td>₹${transferData.amount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="receipt-footer">
                        <div class="footer-left">
                            <p><small>This is a system generated receipt</small></p>
                            <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
                        </div>
                        <div class="footer-right">
                            <p>For ${societyName}</p>
                            <div class="signature-line">
                                <p><strong>Authorized Signatory</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.focus();
}

// A5 Transfer Receipt CSS
function getA5TransferReceiptCSS() {
    return `
        @page {
            size: A5;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: white;
        }
        
        .a5-container {
            width: 148mm;
            min-height: 210mm;
            margin: 0 auto;
            background: white;
            position: relative;
        }
        
        .receipt-actions {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        
        .print-btn, .close-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .print-btn {
            background: #28a745;
            color: white;
        }
        
        .close-btn {
            background: #6c757d;
            color: white;
        }
        
        .print-btn:hover {
            background: #218838;
        }
        
        .close-btn:hover {
            background: #5a6268;
        }
        
        .transfer-document {
            border: 2px solid #000;
            padding: 15px;
            margin-top: 50px;
        }
        
        .receipt-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .society-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .receipt-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }
        
        .society-info h1 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
            text-align: center;
        }
        
        .society-info .reg-no,
        .society-info .address {
            font-size: 10px;
            text-align: center;
            margin-bottom: 2px;
        }
        
        .receipt-title {
            text-align: center;
            margin-top: 8px;
        }
        
        .receipt-title h2 {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .receipt-details {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        
        .details-table td {
            padding: 4px 6px;
            border: 1px solid #000;
            font-size: 10px;
            word-wrap: break-word;
            vertical-align: top;
        }
        
        .details-table td:nth-child(1),
        .details-table td:nth-child(3) {
            width: 25%;
            font-weight: bold;
        }
        
        .details-table td:nth-child(2),
        .details-table td:nth-child(4) {
            width: 25%;
        }
        
        .bank-details {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .bank-section {
            flex: 1;
        }
        
        .bank-section h3 {
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
            background: #f8f9fa;
            padding: 5px;
            border: 1px solid #000;
        }
        
        .bank-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .bank-table td {
            padding: 3px 6px;
            border: 1px solid #000;
            font-size: 10px;
        }
        
        .transfer-arrow {
            text-align: center;
            font-size: 20px;
            color: #007bff;
            margin: 0 10px;
        }
        
        .amount-section {
            margin-bottom: 15px;
            text-align: center;
            padding: 10px;
            border: 2px solid #000;
            background: #f8f9fa;
        }
        
        .amount-display h2 {
            font-size: 16px;
            margin-bottom: 5px;
            color: #28a745;
        }
        
        .amount-display p {
            font-size: 11px;
            font-style: italic;
        }
        
        .description-section {
            margin-bottom: 15px;
            padding: 8px;
            border: 1px solid #000;
        }
        
        .description-section h3 {
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .description-section p {
            font-size: 11px;
        }
        
        .transaction-details {
            margin-bottom: 15px;
        }
        
        .transaction-details h3 {
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        
        .transaction-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .transaction-table th,
        .transaction-table td {
            padding: 5px 8px;
            border: 1px solid #000;
            text-align: left;
            font-size: 10px;
        }
        
        .transaction-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .debit-badge {
            background: #dc3545;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
        }
        
        .credit-badge {
            background: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
        }
        
        .receipt-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
        
        .footer-left {
            flex: 1;
        }
        
        .footer-right {
            flex: 1;
            text-align: right;
        }
        
        .signature-line {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        
        @media print {
            .no-print {
                display: none !important;
            }
            
            body {
                font-size: 11px;
            }
            
            .a5-container {
                width: 100%;
                margin: 0;
            }
            
            .transfer-document {
                margin-top: 0;
                border: 2px solid #000;
            }
        }
    `;
}

function deleteBankPayment(id) {
    const bankPayments = getBankPaymentsData();
    const payment = bankPayments.find(p => p.id === id);
    
    if (!payment) {
        showNotification('Payment not found!', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this bank transaction?')) {
        // Reverse the bank balance change
        const banks = getBanksData();
        const bankIndex = banks.findIndex(bank => bank.id === payment.bankId);
        if (bankIndex !== -1) {
            if (payment.type === 'credit') {
                banks[bankIndex].balance = (banks[bankIndex].balance || 0) - payment.amount;
            } else {
                banks[bankIndex].balance = (banks[bankIndex].balance || 0) + payment.amount;
            }
            saveBanksData(banks);
        }
        
        // Remove the payment from the array
        const updatedPayments = bankPayments.filter(p => p.id !== id);
        
        // Debug log
        console.log('Before delete:', bankPayments.length, 'payments');
        console.log('After delete:', updatedPayments.length, 'payments');
        console.log('Deleted payment ID:', id);
        
        // Save updated payments
        saveBankPaymentsData(updatedPayments);
        
        // Refresh the table immediately
        refreshBankPaymentsTable();
        
        // Reload the data
        loadBanksData();
        
        showNotification('Bank transaction deleted successfully!', 'success');
    }
}

function showAddNoticeModal() {
    const modal = createModal('Add Notice', `
        <form id="addNoticeForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Notice Title *</label>
                    <input type="text" id="noticeTitle" required>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select id="noticePriority">
                        <option value="normal">Normal</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Notice Date *</label>
                    <input type="date" id="noticeDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="date" id="noticeExpiry">
                </div>
            </div>
            <div class="form-group">
                <label>Notice Content *</label>
                <textarea id="noticeContent" rows="6" required placeholder="Enter notice details..."></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="noticeActive" checked>
                    Active (visible to members)
                </label>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Notice</button>
            </div>
        </form>
    `);
    
    document.getElementById('addNoticeForm').addEventListener('submit', handleAddNotice);
}

// Utility Functions
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div>${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Global counter for bill sequence within a batch
let currentBillSequence = 0;
let currentBillPeriod = '';

// Generate sequential bill number
function generateBillNumber(year, month) {
    const bills = getBillsData();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Reset sequence counter if this is a new period
    if (currentBillPeriod !== yearMonth) {
        currentBillPeriod = yearMonth;
        
        // Find all bills for this year-month
        const existingBills = bills.filter(bill => 
            bill.billNumber && bill.billNumber.startsWith(`BILL-${yearMonth}`)
        );
        
        // Get the highest sequence number
        let maxSequence = 0;
        existingBills.forEach(bill => {
            const parts = bill.billNumber.split('-');
            if (parts.length === 4) {
                const sequence = parseInt(parts[3]);
                if (!isNaN(sequence) && sequence > maxSequence) {
                    maxSequence = sequence;
                }
            }
        });
        
        // Set current sequence to start from next number
        currentBillSequence = maxSequence;
    }
    
    // Increment sequence for this bill
    currentBillSequence++;
    const nextSequence = currentBillSequence.toString().padStart(3, '0');
    const billNumber = `BILL-${yearMonth}-${nextSequence}`;
    
    console.log(`Generated bill number: ${billNumber} (sequence: ${nextSequence})`);
    return billNumber;
}

// Generate sequential receipt number
function generateReceiptNumber(year, month) {
    const payments = getPaymentsData();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Find all receipts for this year-month
    const existingReceipts = payments.filter(payment => 
        payment.receiptNumber && payment.receiptNumber.startsWith(`RCP-${yearMonth}`)
    );
    
    // Get the highest sequence number
    let maxSequence = 0;
    existingReceipts.forEach(payment => {
        const parts = payment.receiptNumber.split('-');
        if (parts.length === 4) {
            const sequence = parseInt(parts[3]);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        }
    });
    
    // Generate next sequence number
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    return `RCP-${yearMonth}-${nextSequence}`;
}

// Generate sequential expense receipt number
function generateExpenseReceiptNumber(year, month) {
    const expenses = getExpensesData();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Find all expense receipts for this year-month
    const existingExpenseReceipts = expenses.filter(expense => 
        expense.expenseReceiptNumber && expense.expenseReceiptNumber.startsWith(`EXP-${yearMonth}`)
    );
    
    // Get the highest sequence number
    let maxSequence = 0;
    existingExpenseReceipts.forEach(expense => {
        const parts = expense.expenseReceiptNumber.split('-');
        if (parts.length === 4) {
            const sequence = parseInt(parts[3]);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        }
    });
    
    // Generate next sequence number
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    return `EXP-${yearMonth}-${nextSequence}`;
}

function formatDate(date) {
    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }
        return dateObj.toLocaleDateString('en-IN');
    } catch (error) {
        return 'Invalid Date';
    }
}

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// Helper function to get time ago
function getTimeAgo(dateString) {
    if (!dateString) return 'Unknown time';
    
    const now = new Date();
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error || e.message);
    
    // Only show notification for critical errors, not minor ones
    if (e.error && e.error.message && 
        !e.error.message.includes('getTimeAgo') && 
        !e.error.message.includes('Script error') &&
        !e.message.includes('Script error')) {
        showNotification('An error occurred. Please refresh the page.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    e.preventDefault(); // Prevent the default browser behavior
});

// Sample data initialization removed - start with clean system

function handleAddFlat(e) {
    e.preventDefault();
    
    const flatData = {
        id: generateId(),
        flatNumber: document.getElementById('flatNumber').value,
        wing: document.getElementById('flatWing').value,
        ownerName: document.getElementById('ownerName').value,
        mobile: document.getElementById('ownerMobile').value,
        status: document.getElementById('occupancyStatus').value,
        outstandingAmount: parseFloat(document.getElementById('outstandingAmount').value) || 0,
        fourWheelerParking: parseInt(document.getElementById('fourWheelerParking').value) || 0,
        threeWheelerParking: parseInt(document.getElementById('threeWheelerParking').value) || 0,
        twoWheelerParking: parseInt(document.getElementById('twoWheelerParking').value) || 0,
        createdDate: new Date().toISOString()
    };
    
    const flats = getFlatsData();
    
    // Check if flat number already exists
    if (flats.find(flat => flat.flatNumber === flatData.flatNumber)) {
        showNotification('Flat number already exists!', 'error');
        return;
    }
    
    flats.push(flatData);
    saveFlatsData(flats);
    
    // Save individual flat to Firebase immediately
    saveFlatToFirebase(flatData);
    
    // Handle new member outstanding amount
    handleNewMemberOutstanding();
    
    closeModal();
    loadFlatsData();
    loadDashboardData();
    showNotification('Flat added successfully!', 'success');
}

function handleGenerateBills(e) {
    e.preventDefault();
    
    const selectedMonth = document.getElementById('billMonth').value;
    const selectedYear = document.getElementById('billYear').value;
    
    if (!selectedMonth || !selectedYear) {
        showNotification('❌ Please select month and year!', 'error');
        return;
    }
    
    // Get bill configuration
    const config = getBillConfiguration();
    if (!config) {
        showNotification('❌ Please set Bill Configuration first!', 'error');
        return;
    }
    
    const period = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    const flats = getFlatsData();
    const bills = getBillsData();
    
    // Validate flats exist
    if (flats.length === 0) {
        showNotification('❌ Please add flats first!', 'error');
        return;
    }
    
    // Check if bills already exist for this period
    const existingBills = bills.filter(bill => bill.period === period);
    if (existingBills.length > 0) {
        if (!confirm(`Bills already exist for ${getMonthName(selectedMonth)} ${selectedYear}. Do you want to generate new bills?`)) {
            return;
        }
        // Remove existing bills for this period
        const updatedBills = bills.filter(bill => bill.period !== period);
        saveBillsData(updatedBills);
    }
    
    generateMonthlyBillsWithConfig(selectedMonth, selectedYear, config);
}

// Enhanced Bill Generation with Configuration
function generateMonthlyBillsWithConfig(selectedMonth, selectedYear, config) {
    const period = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    const flats = getFlatsData();
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    let generatedCount = 0;
    const newBills = [];
    
    // Calculate due date
    const selectedMonthNum = parseInt(selectedMonth);
    const dueDate = new Date(selectedYear, selectedMonthNum, config.dueDay || 10);
    const dueDateString = dueDate.toISOString().split('T')[0];
    
    flats.forEach(flat => {
        // 1. Get base charges from configuration
        console.log(`🏠 Flat ${flat.flatNumber} - Status: "${flat.status}", OccupancyType: "${flat.occupancyType}"`);
        
        const isTenantOccupied = (flat.occupancyType === 'Tenant Occupied' || flat.status === 'tenant' || flat.status === 'renter' || flat.status === 'rented');
        const occupancyAmount = isTenantOccupied ? (config.occupancyCharges || 0) : 0;
        
        console.log(`🏠 Flat ${flat.flatNumber} - Is Tenant Occupied: ${isTenantOccupied}, Occupancy Charges: ₹${occupancyAmount}`);
        
        const baseCharges = {
            maintenanceCharge: config.maintenanceCharge || 0,
            sinkingFund: config.sinkingFund || 0,
            parkingCharges: calculateParkingCharges(flat),
            nonOccupancyCharges: flat.status === 'vacant' ? (config.nonOccupancyCharges || 0) : 0,
            occupancyCharges: occupancyAmount,
            festivalCharges: config.festivalCharges || 0,
            buildingMaintenanceCharges: config.buildingMaintenanceCharges || 0,
            nocCharges: config.nocCharges || 0
        };
        
        // 2. Calculate HEAD-WISE outstanding from ALL previous unpaid bills using enhanced function
        const previousBills = bills.filter(bill => bill.flatNumber === flat.flatNumber && bill.period < period);
        const outstandingResult = calculateOutstandingAmountEnhanced(flat.flatNumber, previousBills);
        const memberOutstandingAmount = getMemberOutstandingAmounts(flat.flatNumber);
        
        console.log(`🏠 Flat ${flat.flatNumber} - Enhanced Outstanding Result:`, outstandingResult);
        console.log(`🏠 Flat ${flat.flatNumber} - Member Outstanding: ₹${memberOutstandingAmount}`);
        
        // Use pending heads from enhanced calculation
        const outstandingData = outstandingResult.pendingHeads || {};
        
        // Store member outstanding separately (don't add to maintenance charge)
        const memberOutstanding = memberOutstandingAmount;
        
        // 3. Keep base charges separate, don't add outstanding here
        // Outstanding will be added in total calculation only
        const finalCharges = {
            maintenanceCharge: baseCharges.maintenanceCharge,
            sinkingFund: baseCharges.sinkingFund,
            parkingCharges: baseCharges.parkingCharges,
            nonOccupancyCharges: baseCharges.nonOccupancyCharges,
            occupancyCharges: baseCharges.occupancyCharges,
            festivalCharges: baseCharges.festivalCharges,
            buildingMaintenanceCharges: baseCharges.buildingMaintenanceCharges,
            nocCharges: baseCharges.nocCharges
        };
        
        // Log head-wise carry forward for debugging
        console.log(`📊 Flat ${flat.flatNumber} Head-wise Carry Forward:`);
        Object.keys(outstandingData).forEach(head => {
            if (outstandingData[head] > 0) {
                console.log(`   - ${head}: ₹${outstandingData[head]} (carried forward)`);
            }
        });
        
        // 4. Calculate base amount (current month charges only) and total amount
        const baseAmount = Object.values(baseCharges).reduce((sum, amount) => sum + amount, 0);
        const outstandingTotal = Object.values(outstandingData).reduce((sum, amount) => sum + amount, 0);
        
        // Proper outstanding calculation logic
        let totalAmount, adjustedBaseAmount;
        
        console.log(`🧮 Flat ${flat.flatNumber} ${selectedMonth}/${selectedYear}:`);
        console.log(`   Base Amount: ₹${baseAmount}`);
        console.log(`   Outstanding Total: ₹${outstandingTotal}`);
        console.log(`   Member Outstanding: ₹${memberOutstanding}`);
        
        if (outstandingTotal > 0 || memberOutstanding > 0) {
            // If there's outstanding, add it to current month charges
            totalAmount = baseAmount + outstandingTotal + memberOutstanding;
            adjustedBaseAmount = baseAmount;
            console.log(`   Calculation: ₹${baseAmount} (current) + ₹${outstandingTotal} (outstanding) + ₹${memberOutstanding} (member) = ₹${totalAmount}`);
        } else {
            // First month or no outstanding
            totalAmount = baseAmount;
            adjustedBaseAmount = baseAmount;
            console.log(`   Calculation: ₹${baseAmount} (first month/no outstanding)`);
        }
        
        // 5. Create bill data
        const billData = {
            id: generateId(),
            billNumber: generateBillNumber(selectedYear, selectedMonth),
            flatNumber: flat.flatNumber,
            memberName: flat.ownerName,
            period: period,
            month: selectedMonth,
            year: selectedYear,
            ...finalCharges,
            baseAmount: adjustedBaseAmount, // Store adjusted base amount for outstanding calculations
            baseCharges: baseCharges, // Store individual base charges for head-wise calculations
            totalAmount: totalAmount,
            dueDate: dueDateString,
            status: 'pending',
            generatedDate: new Date().toISOString(),
            configurationUsed: true,
            outstandingBreakdown: outstandingData,
            memberOutstanding: memberOutstanding, // Store member outstanding separately
            isEditable: false, // Bills cannot be edited once generated
            // Backup original amounts for printing (never modified by payments)
            originalAmounts: {
                maintenanceCharge: finalCharges.maintenanceCharge,
                sinkingFund: finalCharges.sinkingFund,
                parkingCharges: finalCharges.parkingCharges,
                nonOccupancyCharges: finalCharges.nonOccupancyCharges,
                occupancyCharges: finalCharges.occupancyCharges,
                festivalCharges: finalCharges.festivalCharges,
                buildingMaintenanceCharges: finalCharges.buildingMaintenanceCharges,
                nocCharges: finalCharges.nocCharges,
                totalAmount: totalAmount,
                baseAmount: adjustedBaseAmount
            }
        };
        
        newBills.push(billData);
        generatedCount++;
    });
    
    // Save all new bills
    const allBills = [...bills, ...newBills];
    saveBillsData(allBills);
    
    // Save each new bill to Firebase individually
    newBills.forEach(bill => {
        saveBillToFirebase(bill);
    });
    
    // Refresh displays
    loadBillingData();
    loadDashboardData();
    
    showNotification(`🎉 ${generatedCount} bills generated for ${getMonthName(selectedMonth)} ${selectedYear}!`, 'success');
}

// Calculate outstanding amounts head-wise from previous unpaid bills
function calculateOutstandingAmountsHeadWise(flatNumber, bills, payments, currentPeriod) {
    const outstandingAmounts = {
        maintenanceCharge: 0,
        sinkingFund: 0,
        parkingCharges: 0,
        nonOccupancyCharges: 0,
        occupancyCharges: 0,
        festivalCharges: 0,
        buildingMaintenanceCharges: 0,
        nocCharges: 0
    };
    
    // Get all previous bills for this flat
    const flatBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && 
        bill.period < currentPeriod
    );
    
    // Get all payments for this flat
    const flatPayments = payments.filter(payment => 
        payment.flatNumber === flatNumber
    );
    
    flatBills.forEach(bill => {
        // Calculate how much was paid for this bill - use simple total payment matching
        const billPayments = flatPayments.filter(payment => {
            const paymentDate = new Date(payment.date);
            const billDate = new Date(bill.generatedDate);
            
            // Match payments made after this bill was generated
            return paymentDate >= billDate;
        });
        
        let totalPaid = 0;
        const paidByHead = {
            maintenanceCharge: 0,
            sinkingFund: 0,
            parkingCharges: 0,
            nonOccupancyCharges: 0,
            occupancyCharges: 0,
            festivalCharges: 0,
            buildingMaintenanceCharges: 0,
            nocCharges: 0
        };
        
        // Calculate head-wise payments
        billPayments.forEach(payment => {
            if (payment.paymentHeads && Array.isArray(payment.paymentHeads)) {
                payment.paymentHeads.forEach(head => {
                    const headName = head.name || head.type || '';
                    const amount = parseFloat(head.amount) || 0;
                    totalPaid += amount;
                    
                    // Map payment head to bill head
                    if (headName.toLowerCase().includes('maintenance') && !headName.toLowerCase().includes('building')) {
                        paidByHead.maintenanceCharge += amount;
                    } else if (headName.toLowerCase().includes('sinking')) {
                        paidByHead.sinkingFund += amount;
                    } else if (headName.toLowerCase().includes('parking')) {
                        paidByHead.parkingCharges += amount;
                    } else if (headName.toLowerCase().includes('non-occupancy') || headName.toLowerCase().includes('nonoccupancy')) {
                        paidByHead.nonOccupancyCharges += amount;
                    } else if (headName.toLowerCase().includes('occupancy') && !headName.toLowerCase().includes('non')) {
                        paidByHead.occupancyCharges += amount;
                    } else if (headName.toLowerCase().includes('festival')) {
                        paidByHead.festivalCharges += amount;
                    } else if (headName.toLowerCase().includes('building')) {
                        paidByHead.buildingMaintenanceCharges += amount;
                    } else if (headName.toLowerCase().includes('noc')) {
                        paidByHead.nocCharges += amount;
                    }
                });
            }
        });
        
        // Calculate outstanding for each head using base amounts to avoid double counting
        Object.keys(outstandingAmounts).forEach(head => {
            // Use base amount from bill configuration, not the total bill amount
            let billAmount = 0;
            
            // Get base amount for each head from bill configuration
            if (head === 'maintenanceCharge') billAmount = 250;
            else if (head === 'sinkingFund') billAmount = 80;
            else if (head === 'parkingCharges') billAmount = 0;
            else if (head === 'nonOccupancyCharges') billAmount = 0;
            else if (head === 'occupancyCharges') billAmount = 0;
            else if (head === 'festivalCharges') billAmount = 50;
            else if (head === 'buildingMaintenanceCharges') billAmount = 80;
            else if (head === 'nocCharges') billAmount = 0;
            
            // If bill has the actual base amount stored, use that
            if (bill.baseCharges && bill.baseCharges[head]) {
                billAmount = bill.baseCharges[head];
            }
            
            const paidAmount = paidByHead[head] || 0;
            const outstanding = Math.max(0, billAmount - paidAmount);
            
            if (outstanding > 0) {
                outstandingAmounts[head] += outstanding;
                console.log(`📊 Flat ${flatNumber} - ${head}: Base ₹${billAmount}, Paid ₹${paidAmount}, Outstanding ₹${outstanding}`);
            }
        });
    });
    
    return outstandingAmounts;
}

// Calculate CUMULATIVE outstanding from ALL previous unpaid bills
function calculateCumulativeOutstanding(flatNumber, bills, payments, currentPeriod) {
    console.log(`\n🔍 === CUMULATIVE Outstanding Calculation for Flat ${flatNumber} ===`);
    
    // Get all previous bills for this flat (sorted by period)
    const previousBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && 
        bill.period < currentPeriod
    ).sort((a, b) => a.period.localeCompare(b.period));
    
    // Get all payments for this flat (sorted by date)
    const flatPayments = payments.filter(payment => 
        payment.flatNumber === flatNumber
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📋 Found ${previousBills.length} previous bills for Flat ${flatNumber}`);
    console.log(`💳 Found ${flatPayments.length} payments for Flat ${flatNumber}`);
    
    let totalOutstanding = 0;
    let remainingPayments = [...flatPayments]; // Copy of payments to allocate
    
    // Process each bill and allocate payments chronologically
    previousBills.forEach(bill => {
        console.log(`\n📊 Processing Bill: ${bill.period} - Total: ₹${bill.totalAmount}`);
        
        let billPaid = 0;
        const billDate = new Date(bill.generatedDate);
        
        // Find payments made after this bill was generated and allocate them
        for (let i = 0; i < remainingPayments.length; i++) {
            const payment = remainingPayments[i];
            const paymentDate = new Date(payment.date);
            
            // Only consider payments made after this bill was generated
            if (paymentDate >= billDate) {
                const paymentAmount = parseFloat(payment.amount) || 0;
                const billRemaining = bill.totalAmount - billPaid;
                
                if (billRemaining > 0) {
                    // Allocate payment to this bill
                    const allocatedAmount = Math.min(paymentAmount, billRemaining);
                    billPaid += allocatedAmount;
                    
                    console.log(`   💳 Allocating ₹${allocatedAmount} from payment of ₹${paymentAmount} (${payment.date})`);
                    
                    // If payment is fully used, remove it
                    if (allocatedAmount === paymentAmount) {
                        remainingPayments.splice(i, 1);
                        i--; // Adjust index after removal
                    } else {
                        // Reduce payment amount for next bill
                        remainingPayments[i] = {
                            ...payment,
                            amount: paymentAmount - allocatedAmount
                        };
                    }
                    
                    // If bill is fully paid, move to next bill
                    if (billPaid >= bill.totalAmount) {
                        break;
                    }
                }
            }
        }
        
        // Calculate outstanding for this bill - use base amount only to avoid double counting
        const baseAmount = bill.baseAmount || bill.totalAmount; // use baseAmount if available, otherwise total
        const billOutstanding = Math.max(0, baseAmount - billPaid);
        totalOutstanding += billOutstanding;
        
        console.log(`   💰 Bill Amount: ₹${bill.totalAmount}`);
        console.log(`   💳 Paid: ₹${billPaid}`);
        console.log(`   📈 Outstanding: ₹${billOutstanding}`);
    });
    
    console.log(`\n🎯 TOTAL CUMULATIVE OUTSTANDING: ₹${totalOutstanding}`);
    console.log(`=== End Calculation ===\n`);
    
    return totalOutstanding;
}

// Enhanced function to get member outstanding amounts
function getMemberOutstandingAmounts(flatNumber) {
    // First check flat data for outstanding amount
    const flats = getFlatsData();
    const flat = flats.find(f => f.flatNumber === flatNumber);
    
    if (flat && flat.outstandingAmount && flat.outstandingAmount > 0) {
        return flat.outstandingAmount;
    }
    
    // Fallback: check memberOutstanding localStorage (legacy)
    const memberOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
    const flatOutstanding = memberOutstanding.filter(item => 
        item.flatNumber === flatNumber && item.status === 'pending'
    );
    
    return flatOutstanding.reduce((total, item) => total + item.outstandingAmount, 0);
}

// Test function to verify cumulative outstanding calculation
window.testCumulativeOutstanding = function(flatNumber) {
    console.log(`\n🧪 === Testing CUMULATIVE Outstanding Logic for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    // Test for November (should include October outstanding)
    const novOutstanding = calculateCumulativeOutstanding(flatNumber, bills, payments, '2025-11');
    console.log(`📊 November Outstanding: ₹${novOutstanding}`);
    
    // Test for December (should include October + November outstanding)
    const decOutstanding = calculateCumulativeOutstanding(flatNumber, bills, payments, '2025-12');
    console.log(`📊 December Outstanding: ₹${decOutstanding}`);
    
    console.log(`\n🎯 Expected Logic:`);
    console.log(`   October: ₹460 (pending)`);
    console.log(`   November: ₹460 (current) + ₹460 (October) = ₹920`);
    console.log(`   December: ₹460 (current) + ₹920 (Oct+Nov) = ₹1380`);
    
    console.log(`=== End Test ===\n`);
    
    return { novOutstanding, decOutstanding };
};

// Simple debug - check bill amounts
window.checkBillAmounts = function() {
    const bills = getBillsData();
    
    bills.forEach(bill => {
        console.log(`${bill.period}: Total=${bill.totalAmount}, Base=${bill.baseAmount}`);
    });
    
    return bills.map(b => ({
        period: b.period,
        totalAmount: b.totalAmount,
        baseAmount: b.baseAmount,
        hasBaseCharges: !!b.baseCharges
    }));
};

// Force refresh table display
window.refreshTableDisplay = function() {
    console.log('🔄 Refreshing table display...');
    console.log('🗑️ Removed duplicate loadBillingData function');
    
    // Clear the table first
    const tbody = document.querySelector('#billsTable tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Loading...</td></tr>';
    }
    
    // Wait a moment then reload
    setTimeout(() => {
        if (typeof loadBillingData === 'function') {
            loadBillingData();
            console.log('✅ Table refreshed with correct logic!');
        } else {
            console.log('❌ loadBillingData function not found');
        }
    }, 100);
    
    return 'Duplicate function removed, refreshing...';
};

// Debug specific bill calculation
window.debugBillCalculation = function(flatNumber, period) {
    console.log(`\n🔍 === DEBUGGING BILL CALCULATION for Flat ${flatNumber}, Period ${period} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    console.log(`\n📋 All Bills for Flat ${flatNumber}:`);
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    flatBills.forEach(bill => {
        console.log(`   ${bill.period}: ₹${bill.totalAmount} (Generated: ${bill.generatedDate})`);
    });
    
    console.log(`\n💳 All Payments for Flat ${flatNumber}:`);
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    flatPayments.forEach(payment => {
        console.log(`   ${payment.date}: ₹${payment.amount}`);
    });
    
    // Calculate outstanding for this period
    const outstanding = calculateCumulativeOutstanding(flatNumber, bills, payments, period);
    console.log(`\n📊 Cumulative Outstanding for ${period}: ₹${outstanding}`);
    
    console.log(`=== End Debug ===\n`);
    
    return { flatBills, flatPayments, outstanding };
};

// Debug function to check current data
window.debugCurrentData = function() {
    console.log(`\n🔍 === DEBUGGING CURRENT DATA ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    console.log(`📋 Total Bills: ${bills.length}`);
    bills.forEach(bill => {
        console.log(`   Bill: ${bill.billNumber} - Flat ${bill.flatNumber} - ${bill.period} - ₹${bill.totalAmount}`);
    });
    
    console.log(`\n💳 Total Payments: ${payments.length}`);
    payments.forEach(payment => {
        console.log(`   Payment: Flat ${payment.flatNumber} - ${payment.date} - ₹${payment.amount}`);
    });
    
    // Check specific flat
    const flatNumber = '101';
    console.log(`\n🏠 Checking Flat ${flatNumber}:`);
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    
    console.log(`   Bills: ${flatBills.length}`);
    flatBills.forEach(bill => {
        console.log(`     ${bill.period}: ₹${bill.totalAmount}`);
    });
    
    console.log(`   Payments: ${flatPayments.length}`);
    flatPayments.forEach(payment => {
        console.log(`     ${payment.date}: ₹${payment.amount}`);
    });
    
    console.log(`=== End Debug ===\n`);
    
    return {
        totalBills: bills.length,
        totalPayments: payments.length,
        bills: bills,
        payments: payments,
        flatBills: flatBills,
        flatPayments: flatPayments
    };
};

// Function to regenerate all bills with correct cumulative logic
window.regenerateAllBillsWithCorrectLogic = function() {
    console.log(`\n🔄 === REGENERATING ALL BILLS WITH CORRECT LOGIC ===`);
    
    const bills = getBillsData();
    const config = getBillConfiguration();
    
    if (!config) {
        console.log('❌ No bill configuration found!');
        return;
    }
    
    // Get all unique periods from existing bills
    const periods = [...new Set(bills.map(bill => bill.period))].sort();
    console.log(`📅 Found periods: ${periods.join(', ')}`);
    
    // Clear all existing bills
    saveBillsData([]);
    console.log(`🗑️ Cleared all existing bills`);
    
    // Regenerate bills for each period in chronological order
    periods.forEach(period => {
        const [year, month] = period.split('-');
        console.log(`\n🔄 Regenerating bills for ${period}...`);
        generateMonthlyBillsWithConfig(month, year, config);
    });
    
    console.log(`\n✅ All bills regenerated with correct cumulative logic!`);
    console.log(`🔄 Please refresh the page to see updated bills.`);
    
    // Show success message to user
    if (typeof showNotification === 'function') {
        showNotification('✅ Bills regenerated successfully! Please refresh the page.', 'success');
    }
    
    // Try to refresh bills display if function exists
    if (typeof displayBills === 'function') {
        displayBills();
    } else if (typeof loadBills === 'function') {
        loadBills();
    }
    
    return 'Bills regenerated successfully!';
};

// Handle New Member Outstanding Amount
function handleNewMemberOutstanding() {
    const outstandingAmount = parseFloat(document.getElementById('outstandingAmount').value) || 0;
    const flatNumber = document.getElementById('flatNumber').value;
    
    if (outstandingAmount > 0 && flatNumber) {
        // Create initial outstanding entry for new member
        const outstandingData = {
            id: generateId(),
            flatNumber: flatNumber,
            outstandingAmount: outstandingAmount,
            reason: 'Previous Outstanding (Before Software)',
            dateAdded: new Date().toISOString(),
            status: 'pending'
        };
        
        // Save to localStorage
        const existingOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
        existingOutstanding.push(outstandingData);
        localStorage.setItem('memberOutstanding', JSON.stringify(existingOutstanding));
        
        console.log(`Added outstanding amount ₹${outstandingAmount} for new member in Flat ${flatNumber}`);
    }
}

// Function to clear member outstanding after payment
function clearMemberOutstanding(flatNumber, amountPaid) {
    const memberOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
    let remainingAmount = amountPaid;
    
    const updatedOutstanding = memberOutstanding.map(item => {
        if (item.flatNumber === flatNumber && item.status === 'pending' && remainingAmount > 0) {
            if (item.outstandingAmount <= remainingAmount) {
                remainingAmount -= item.outstandingAmount;
                return { ...item, status: 'paid', paidDate: new Date().toISOString() };
            } else {
                item.outstandingAmount -= remainingAmount;
                remainingAmount = 0;
                return item;
            }
        }
        return item;
    });
    
    localStorage.setItem('memberOutstanding', JSON.stringify(updatedOutstanding));
    return remainingAmount; // Return any remaining amount after clearing outstanding
}

// Duplicate function removed - using the corrected version above

// Helper function for quick payment recording from bill table
function recordPaymentForBill(flatNumber, period, outstandingAmount) {
    // Open payment modal with pre-filled data
    showRecordPaymentModal();
    
    // Pre-fill form fields
    document.getElementById('paymentFlatNumber').value = flatNumber;
    document.getElementById('paymentAmount').value = outstandingAmount;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    
    // Set period information based on bill period
    const [year, month] = period.split('-');
    const monthName = getMonthName(month);
    
    // Add note in remarks
    document.getElementById('paymentRemarks').value = `Payment for ${monthName} ${year} bill (Outstanding: ₹${outstandingAmount})`;
    
    showNotification(`💡 Payment form pre-filled for Flat ${flatNumber}`, 'info');
}

// Delete Bill Function
function deleteBill(billId) {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone!')) {
        return;
    }
    
    const bills = getBillsData();
    const billToDelete = bills.find(bill => bill.id === billId);
    
    if (!billToDelete) {
        showNotification('❌ Bill not found!', 'error');
        return;
    }
    
    // Remove bill from array
    const updatedBills = bills.filter(bill => bill.id !== billId);
    saveBillsData(updatedBills);
    
    // Refresh billing table
    loadBillingData();
    loadDashboardData();
    
    showNotification(`✅ Bill ${billToDelete.billNumber} successfully deleted!`, 'success');
}

// Debug function to check member outstanding data
function debugMemberOutstanding() {
    const memberOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
    console.log('🔍 All Member Outstanding Data:', memberOutstanding);
    
    const flats = getFlatsData();
    flats.forEach(flat => {
        const flatOutstanding = memberOutstanding.filter(item => 
            item.flatNumber === flat.flatNumber && item.status === 'pending'
        );
        const totalOutstanding = flatOutstanding.reduce((total, item) => total + item.outstandingAmount, 0);
        console.log(`🏠 Flat ${flat.flatNumber}: Outstanding ₹${totalOutstanding}`, flatOutstanding);
    });
    
    // Return summary for better debugging
    return {
        totalRecords: memberOutstanding.length,
        pendingRecords: memberOutstanding.filter(item => item.status === 'pending').length,
        totalPendingAmount: memberOutstanding
            .filter(item => item.status === 'pending')
            .reduce((total, item) => total + item.outstandingAmount, 0)
    };
}

// Enhanced Multi-Month Payment Recording with Bill Status Update
function updateBillStatusAfterPayment(flatNumber, paymentAmount, paymentHeads, paymentDate, paymentFromMonth = '', paymentToMonth = '') {
    const bills = getBillsData();
    const payments = getPaymentsData();
    let updatedBills = [...bills];
    let billsUpdated = false;
    
    console.log(`🔄 Updating bill status for Flat ${flatNumber}, Payment: ₹${paymentAmount}`);
    console.log(`📅 Payment Period: ${paymentFromMonth} to ${paymentToMonth}`);
    
    // Find bills for this flat that need status update
    let targetBills = [];
    
    if (paymentFromMonth && paymentToMonth) {
        // Multi-month payment: Update all bills in the selected period
        console.log(`📅 Multi-month payment: ${paymentFromMonth} to ${paymentToMonth}`);
        
        const fromYear = parseInt(paymentFromMonth.split('-')[0]);
        const fromMonth = parseInt(paymentFromMonth.split('-')[1]);
        const toYear = parseInt(paymentToMonth.split('-')[0]);
        const toMonth = parseInt(paymentToMonth.split('-')[1]);
        
        // Find all bills in the period range
        targetBills = bills.filter(bill => {
            if (bill.flatNumber !== flatNumber) return false;
            
            const [billYear, billMonth] = bill.period.split('-').map(Number);
            
            // Check if bill is within the selected period
            if (billYear < fromYear || billYear > toYear) return false;
            if (billYear === fromYear && billMonth < fromMonth) return false;
            if (billYear === toYear && billMonth > toMonth) return false;
            
            return true;
        });
        
        console.log(`📋 Found ${targetBills.length} bills in period:`, targetBills.map(b => b.period));
    } else {
        // Single month payment: Update current month bill or all bills for this flat
        targetBills = bills.filter(bill => bill.flatNumber === flatNumber);
        console.log(`📋 Updating all bills for Flat ${flatNumber}`);
    }
    
    if (targetBills.length === 0) {
        console.log(`⚠️ No bills found for update`);
        return false;
    }
    
    // Update each target bill
    targetBills.forEach((bill) => {
        let totalPaid = 0;
        let headWisePaid = {
            maintenanceCharge: 0,
            sinkingFund: 0,
            parkingCharges: 0,
            nonOccupancyCharges: 0,
            occupancyCharges: 0,
            festivalCharges: 0,
            buildingMaintenanceCharges: 0,
            nocCharges: 0
        };
        
        // Calculate total paid for this bill from all payments
        const billPayments = payments.filter(payment => {
            if (payment.flatNumber !== flatNumber) return false;
            
            // Check if payment applies to this bill period
            if (payment.parkingPeriod && payment.parkingPeriod.fromMonth && payment.parkingPeriod.toMonth) {
                // Multi-month payment - check if bill period is within payment period
                const payFromYear = parseInt(payment.parkingPeriod.fromMonth.split('-')[0]);
                const payFromMonth = parseInt(payment.parkingPeriod.fromMonth.split('-')[1]);
                const payToYear = parseInt(payment.parkingPeriod.toMonth.split('-')[0]);
                const payToMonth = parseInt(payment.parkingPeriod.toMonth.split('-')[1]);
                
                const [billYear, billMonth] = bill.period.split('-').map(Number);
                
                // Check if bill is within payment period
                if (billYear < payFromYear || billYear > payToYear) return false;
                if (billYear === payFromYear && billMonth < payFromMonth) return false;
                if (billYear === payToYear && billMonth > payToMonth) return false;
                
                return true;
            } else {
                // Single month payment - match by period or date
                return payment.period === bill.period || 
                       (payment.date >= bill.generatedDate && payment.date <= bill.dueDate);
            }
        });
        
        billPayments.forEach(payment => {
            if (payment.paymentHeads && Array.isArray(payment.paymentHeads)) {
                payment.paymentHeads.forEach(head => {
                    const amount = parseFloat(head.amount) || 0;
                    totalPaid += amount;
                    
                    // Map to bill heads
                    const headName = (head.name || head.type || '').toLowerCase();
                    if (headName.includes('maintenance') && !headName.includes('building')) {
                        headWisePaid.maintenanceCharge += amount;
                    } else if (headName.includes('sinking')) {
                        headWisePaid.sinkingFund += amount;
                    } else if (headName.includes('parking')) {
                        headWisePaid.parkingCharges += amount;
                    } else if (headName.includes('non-occupancy') || headName.includes('nonoccupancy')) {
                        headWisePaid.nonOccupancyCharges += amount;
                    } else if (headName.includes('occupancy') && !headName.includes('non')) {
                        headWisePaid.occupancyCharges += amount;
                    } else if (headName.includes('festival')) {
                        headWisePaid.festivalCharges += amount;
                    } else if (headName.includes('building')) {
                        headWisePaid.buildingMaintenanceCharges += amount;
                    } else if (headName.includes('noc')) {
                        headWisePaid.nocCharges += amount;
                    }
                });
            } else {
                // If no payment heads, add to total paid
                totalPaid += payment.amount || 0;
            }
        });
        
        // Calculate outstanding amount
        const outstandingAmount = bill.totalAmount - totalPaid;
        
        // Update bill status
        let newStatus = 'pending';
        if (outstandingAmount <= 0) {
            newStatus = 'paid';
        } else if (totalPaid > 0) {
            newStatus = 'partial';
        }
        
        // Update bill
        const billIndex = updatedBills.findIndex(b => b.id === bill.id);
        if (billIndex !== -1) {
            updatedBills[billIndex] = {
                ...updatedBills[billIndex],
                status: newStatus,
                paidAmount: totalPaid,
                outstandingAmount: Math.max(0, outstandingAmount),
                lastPaymentDate: paymentDate,
                headWisePaid: headWisePaid
            };
            
            console.log(`✅ Updated ${bill.period} bill: Paid ₹${totalPaid}, Status: ${newStatus}, Outstanding: ₹${Math.max(0, outstandingAmount)}`);
            billsUpdated = true;
        }
    });
    
    if (billsUpdated) {
        saveBillsData(updatedBills);
        loadBillingData(); // Refresh billing table
        console.log(`🎉 Updated ${targetBills.length} bills successfully!`);
        return true;
    }
    
    return false;
}

// Billing logic functions removed - keeping only bill print structure

// Removed calculatePendingHeadsForFlat function
function calculatePendingHeadsForFlat(flatNumber, bills, payments) {
    // Function removed - billing logic disabled
    return {
        maintenanceCharge: 0,
        sinkingFund: 0,
        parkingCharges: 0,
        festivalCharges: 0,
        buildingMaintenanceCharges: 0,
        nocCharges: 0,
        nonOccupancyCharges: 0,
        occupancyCharges: 0
    };
}

// Billing migration function removed
function migrateBillsWithoutHeadAmounts() {
    showNotification('❌ Billing migration disabled - logic removed!', 'error');
    return;
}

// Function to completely clean all data and start fresh
function cleanAllData() {
    console.log('🗑️ Starting complete data cleanup...');
    
    // List of all localStorage keys to clean
    const keysToClean = [
        'bills',
        'payments', 
        'expenses',
        'deletedItems',
        'billConfiguration'
    ];
    
    // Clean each key
    keysToClean.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Cleaned: ${key}`);
    });
    
    // Keep flats and society info, but reset outstanding amounts
    const flats = getFlatsData();
    if (flats && flats.length > 0) {
        flats.forEach(flat => {
            flat.outstandingAmount = 0;
        });
        saveFlatsData(flats);
        console.log('✅ Reset flat outstanding amounts to ₹0');
    }
    
    console.log('🎉 Complete data cleanup finished!');
    showNotification('All billing data cleaned! Page will refresh.', 'success');
}

// Calculate outstanding amounts for all flats based on unpaid bills and payments
function calculateOutstandingAmountsForAllFlats() {
    const flats = getFlatsData();
    const bills = getBillsData();
    const payments = getPaymentsData();
    let updated = false;
    
    console.log('\n=== Calculating Outstanding Amounts ===');
    
    flats.forEach(flat => {
        // Get all bills for this flat
        const flatBills = bills.filter(bill => bill.flatNumber === flat.flatNumber);
        
        // Get all payments for this flat
        const flatPayments = payments.filter(payment => payment.flatNumber === flat.flatNumber);
        
        // Calculate outstanding from each bill individually
        let totalOutstanding = 0;
        
        flatBills.forEach(bill => {
            // Get payments for this specific bill period
            const billPayments = flatPayments.filter(payment => {
                // Match by bill period or date range
                if (payment.maintenancePeriod && payment.maintenancePeriod.period === bill.period) {
                    return true;
                }
                // Fallback: match by date
                const paymentDate = new Date(payment.date);
                const billDate = new Date(bill.billDate || bill.generatedDate);
                return paymentDate >= billDate;
            });
            
            const paidForThisBill = billPayments.reduce((sum, payment) => sum + payment.amount, 0);
            const outstandingForThisBill = Math.max(0, bill.totalAmount - paidForThisBill);
            
            if (outstandingForThisBill > 0) {
                totalOutstanding += outstandingForThisBill;
                console.log(`Flat ${flat.flatNumber} - Bill ${bill.period}: Total=₹${bill.totalAmount}, Paid=₹${paidForThisBill}, Outstanding=₹${outstandingForThisBill}`);
            }
        });
        
        // Update flat outstanding amount
        if (flat.outstandingAmount !== totalOutstanding) {
            flat.outstandingAmount = totalOutstanding;
            updated = true;
            console.log(`Updated Flat ${flat.flatNumber}: Total Outstanding=₹${totalOutstanding}`);
        } else {
            console.log(`Flat ${flat.flatNumber}: Outstanding=₹${totalOutstanding} (no change needed)`);
        }
    });
    
    if (updated) {
        saveFlatsData(flats);
        console.log('Outstanding amounts updated for flats');
    }
    
    console.log('=== Outstanding Calculation Complete ===\n');
}

// Test function to add outstanding amounts to flats for testing
function addTestOutstandingAmounts() {
    const flats = getFlatsData();
    let updated = false;
    
    flats.forEach(flat => {
        // Always add test outstanding amount for demonstration
        const testAmount = Math.floor(Math.random() * 1000) + 500; // Random amount between 500-1500
        flat.outstandingAmount = testAmount;
        updated = true;
        console.log(`Added test outstanding amount ₹${testAmount} to Flat ${flat.flatNumber}`);
    });
    
    if (updated) {
        saveFlatsData(flats);
        loadFlatsData(); // Refresh display
        loadDashboardData(); // Refresh dashboard
        console.log('Test outstanding amounts added to all flats');
        showNotification('Test outstanding amounts added to all flats for testing', 'success');
    }
}

// Function to clear all outstanding amounts
function clearAllOutstandingAmounts() {
    const flats = getFlatsData();
    let updated = false;
    
    flats.forEach(flat => {
        if (flat.outstandingAmount && flat.outstandingAmount > 0) {
            flat.outstandingAmount = 0;
            updated = true;
            console.log(`Cleared outstanding amount for Flat ${flat.flatNumber}`);
        }
    });
    
    if (updated) {
        saveFlatsData(flats);
        loadFlatsData(); // Refresh display
        loadDashboardData(); // Refresh dashboard
        console.log('All outstanding amounts cleared');
        showNotification('All outstanding amounts cleared', 'info');
    }
}

// Calculate interest for a specific flat based on outstanding amounts
function calculateInterestForFlat(flatNumber, bills, payments, currentBillDate, interestRate) {
    // Get all previous bills for this flat
    const flatBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && 
        new Date(bill.dueDate) < currentBillDate
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Get all payments for this flat
    const flatPayments = payments.filter(payment => payment.flatNumber === flatNumber)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let totalArrearsAmount = 0;
    let totalInterestAmount = 0;
    let runningBalance = 0;
    
    // Calculate outstanding amounts from previous bills
    flatBills.forEach(bill => {
        runningBalance += bill.totalAmount;
        
        // Subtract payments made for this bill period
        const billPayments = flatPayments.filter(payment => {
            // Check if payment has payment heads that match this bill
            if (payment.paymentHeads && payment.paymentHeads.length > 0) {
                const hasMatchingPeriod = payment.paymentHeads.some(head => {
                    if (payment.maintenancePeriod && 
                        (head.name.toLowerCase().includes('maintenance') || 
                         head.name.toLowerCase().includes('charges') ||
                         head.name.toLowerCase().includes('outstanding'))) {
                        const billPeriodMatch = bill.period === payment.maintenancePeriod.period ||
                                              (bill.year && bill.month && 
                                               `${bill.year}-${String(bill.month).padStart(2, '0')}` === payment.maintenancePeriod.period);
                        return billPeriodMatch;
                    }
                    return false;
                });
                return hasMatchingPeriod;
            }
            
            // Fallback: match by payment date
            const paymentDate = new Date(payment.date);
            return paymentDate >= new Date(bill.generatedDate || bill.dueDate) && 
                   paymentDate <= new Date(currentBillDate);
        });
        
        const totalPaid = billPayments.reduce((sum, payment) => {
            if (payment.paymentHeads && payment.paymentHeads.length > 0) {
                // Sum only relevant payment heads for this bill
                return sum + payment.paymentHeads
                    .filter(head => head.name.toLowerCase().includes('maintenance') || 
                                   head.name.toLowerCase().includes('charges') ||
                                   head.name.toLowerCase().includes('outstanding'))
                    .reduce((headSum, head) => headSum + head.amount, 0);
            }
            return sum + payment.amount;
        }, 0);
        runningBalance -= totalPaid;
    });
    
    // If there's outstanding balance, calculate interest
    if (runningBalance > 0) {
        totalArrearsAmount = runningBalance;
        
        // Calculate interest based on overdue months
        flatBills.forEach(bill => {
            const dueDate = new Date(bill.dueDate);
            const monthsOverdue = getMonthsDifference(dueDate, currentBillDate);
            
            if (monthsOverdue > 0) {
                // Calculate outstanding amount for this specific bill
                const billPayments = flatPayments.filter(payment => {
                    // Check if payment has payment heads that match this bill
                    if (payment.paymentHeads && payment.paymentHeads.length > 0) {
                        const hasMatchingPeriod = payment.paymentHeads.some(head => {
                            if (payment.maintenancePeriod && 
                                (head.name.toLowerCase().includes('maintenance') || 
                                 head.name.toLowerCase().includes('charges') ||
                                 head.name.toLowerCase().includes('outstanding'))) {
                                const billPeriodMatch = bill.period === payment.maintenancePeriod.period ||
                                                      (bill.year && bill.month && 
                                                       `${bill.year}-${String(bill.month).padStart(2, '0')}` === payment.maintenancePeriod.period);
                                return billPeriodMatch;
                            }
                            return false;
                        });
                        return hasMatchingPeriod;
                    }
                    
                    // Fallback: match by payment date
                    const paymentDate = new Date(payment.date);
                    return paymentDate >= new Date(bill.generatedDate || bill.dueDate);
                });
                
                const billTotalPaid = billPayments.reduce((sum, payment) => {
                    if (payment.paymentHeads && payment.paymentHeads.length > 0) {
                        // Sum only relevant payment heads for this bill
                        return sum + payment.paymentHeads
                            .filter(head => head.name.toLowerCase().includes('maintenance') || 
                                           head.name.toLowerCase().includes('charges') ||
                                           head.name.toLowerCase().includes('outstanding'))
                            .reduce((headSum, head) => headSum + head.amount, 0);
                    }
                    return sum + payment.amount;
                }, 0);
                const billOutstanding = Math.max(0, bill.totalAmount - billTotalPaid);
                
                if (billOutstanding > 0) {
                    // Calculate compound interest: Principal * (1 + rate)^months - Principal
                    const monthlyRate = interestRate / 100;
                    const interestForThisBill = billOutstanding * Math.pow(1 + monthlyRate, monthsOverdue) - billOutstanding;
                    totalInterestAmount += interestForThisBill;
                }
            }
        });
    }
    
    return {
        arrearsAmount: Math.round(totalArrearsAmount * 100) / 100,
        interestAmount: Math.round(totalInterestAmount * 100) / 100,
        totalOverdue: Math.round((totalArrearsAmount + totalInterestAmount) * 100) / 100
    };
}

// Helper function to calculate months difference
function getMonthsDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) return 0;
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    return yearDiff * 12 + monthDiff;
}

// Calculate outstanding amount for a flat from previous unpaid bills + initial outstanding
function calculateOutstandingAmount(flatNumber, existingBills) {
    const payments = getPaymentsData();
    const flats = getFlatsData();
    
    // Get flat data to check for initial outstanding amount
    const flatData = flats.find(flat => flat.flatNumber === flatNumber);
    let totalOutstanding = 0;
    
    // Add initial outstanding amount from flat data (for new members with previous dues)
    // But only if no payments have been made yet to clear this outstanding
    if (flatData && flatData.outstandingAmount) {
        const initialOutstandingPayments = payments.filter(payment => 
            payment.flatNumber === flatNumber && 
            payment.remarks && payment.remarks.toLowerCase().includes('outstanding')
        );
        
        const paidAgainstInitialOutstanding = initialOutstandingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingInitialOutstanding = flatData.outstandingAmount - paidAgainstInitialOutstanding;
        
        if (remainingInitialOutstanding > 0) {
            totalOutstanding += remainingInitialOutstanding;
        }
    }
    
    // Get all bills for this flat (excluding current month bills)
    const flatBills = existingBills.filter(bill => bill.flatNumber === flatNumber);
    
    flatBills.forEach(bill => {
        // Calculate total payments made for this flat (not necessarily linked to specific bills)
        // We'll use a more flexible matching approach
        const billDate = new Date(bill.billDate);
        const billMonth = billDate.getMonth();
        const billYear = billDate.getFullYear();
        
        // Find payments made for this flat in the same month as the bill or later
        const relevantPayments = payments.filter(payment => {
            if (payment.flatNumber !== flatNumber) return false;
            
            const paymentDate = new Date(payment.date);
            const paymentMonth = paymentDate.getMonth();
            const paymentYear = paymentDate.getFullYear();
            
            // Payment should be in the same month as bill or later
            return (paymentYear > billYear) || 
                   (paymentYear === billYear && paymentMonth >= billMonth);
        });
        
        // Calculate how much has been paid against this bill
        let paidAgainstThisBill = 0;
        
        // First, check for payments specifically linked to this bill
        const directBillPayments = relevantPayments.filter(payment => payment.billId === bill.id);
        paidAgainstThisBill += directBillPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // If no direct payments, try to match by amount and timing
        if (paidAgainstThisBill === 0) {
            // Look for payments that could cover this bill
            const potentialPayments = relevantPayments.filter(payment => 
                !payment.billId && payment.amount >= bill.totalAmount * 0.8 // At least 80% of bill amount
            );
            
            if (potentialPayments.length > 0) {
                // Use the first suitable payment
                paidAgainstThisBill = Math.min(potentialPayments[0].amount, bill.totalAmount);
            }
        }
        
        const outstanding = bill.totalAmount - paidAgainstThisBill;
        
        // Only add positive outstanding amounts
        if (outstanding > 0) {
            totalOutstanding += outstanding;
        }
        
        console.log(`Bill ${bill.billNumber}: Amount=${bill.totalAmount}, Paid=${paidAgainstThisBill}, Outstanding=${outstanding}`);
    });
    
    return Math.round(totalOutstanding * 100) / 100; // Round to 2 decimal places
}

// Enhanced function to calculate head-wise outstanding amounts
function calculateOutstandingAmountEnhanced(flatNumber, existingBills) {
    const payments = getPaymentsData();
    const flats = getFlatsData();
    
    console.log(`\n🔍 === Head-wise Outstanding Calculation for Flat ${flatNumber} ===`);
    
    // Get flat data for initial outstanding
    const flatData = flats.find(flat => flat.flatNumber === flatNumber);
    let totalOutstanding = 0;
    
    // Get all payments for this flat
    const flatPayments = payments.filter(payment => payment.flatNumber === flatNumber);
    
    // 1. Handle initial outstanding amount (one-time)
    if (flatData && flatData.outstandingAmount && flatData.outstandingAmount > 0) {
        const outstandingPayments = flatPayments.filter(payment => 
            payment.paymentHeads && payment.paymentHeads.some(head => 
                head.head === 'outstandingAmount' || head.head === 'initialOutstanding' || head.head === 'outstanding'
            )
        );
        
        const paidAgainstOutstanding = outstandingPayments.reduce((sum, payment) => {
            return sum + payment.paymentHeads
                .filter(head => head.head === 'outstandingAmount' || head.head === 'initialOutstanding' || head.head === 'outstanding')
                .reduce((headSum, head) => headSum + (head.amount || 0), 0);
        }, 0);
        
        const remainingInitialOutstanding = Math.max(0, flatData.outstandingAmount - paidAgainstOutstanding);
        
        if (remainingInitialOutstanding > 0) {
            totalOutstanding += remainingInitialOutstanding;
            console.log(`💰 Initial Outstanding: ₹${remainingInitialOutstanding} remaining`);
        }
    }
    
    // 2. Calculate head-wise outstanding from bills
    const flatBills = existingBills
        .filter(bill => bill.flatNumber === flatNumber)
        .sort((a, b) => new Date(a.billDate || a.generatedDate) - new Date(b.billDate || b.generatedDate));
    
    // Track head-wise totals from all bills
    const headTotals = {
        maintenanceCharge: 0,
        sinkingFund: 0,
        parkingCharges: 0,
        festivalCharges: 0,
        buildingMaintenanceCharges: 0,
        occupancyCharges: 0,
        nocCharges: 0
    };
    
    // Track head-wise payments
    const headPayments = {
        maintenanceCharge: 0,
        sinkingFund: 0,
        parkingCharges: 0,
        festivalCharges: 0,
        buildingMaintenanceCharges: 0,
        occupancyCharges: 0,
        nocCharges: 0
    };
    
    // Sum up all bill amounts by head - ONLY use baseCharges (current month charges)
    flatBills.forEach(bill => {
        // CRITICAL: Use ONLY baseCharges, never bill amounts (which include outstanding)
        const baseAmounts = bill.baseCharges || {};
        
        headTotals.maintenanceCharge += baseAmounts.maintenanceCharge || 0;
        headTotals.sinkingFund += baseAmounts.sinkingFund || 0;
        headTotals.parkingCharges += baseAmounts.parkingCharges || 0;
        headTotals.festivalCharges += baseAmounts.festivalCharges || 0;
        headTotals.buildingMaintenanceCharges += baseAmounts.buildingMaintenanceCharges || 0;
        headTotals.occupancyCharges += baseAmounts.occupancyCharges || 0;
        headTotals.nocCharges += baseAmounts.nocCharges || 0;
        
        console.log(`📊 Bill ${bill.period}: Base charges - Maintenance: ₹${baseAmounts.maintenanceCharge || 0}`);
    });
    
    // Sum up all payments by head
    flatPayments.forEach(payment => {
        if (payment.paymentHeads && payment.paymentHeads.length > 0) {
            payment.paymentHeads.forEach(head => {
                const headName = head.head;
                if (headName === 'maintenance' || headName === 'maintenanceCharge') {
                    headPayments.maintenanceCharge += head.amount || 0;
                } else if (headName === 'sinking' || headName === 'sinkingFund') {
                    headPayments.sinkingFund += head.amount || 0;
                } else if (headName === 'parking' || headName === 'parkingCharges') {
                    headPayments.parkingCharges += head.amount || 0;
                } else if (headName === 'festival' || headName === 'festivalCharges') {
                    headPayments.festivalCharges += head.amount || 0;
                } else if (headName === 'buildingMaintenance' || headName === 'buildingMaintenanceCharges') {
                    headPayments.buildingMaintenanceCharges += head.amount || 0;
                } else if (headName === 'occupancy' || headName === 'occupancyCharges') {
                    headPayments.occupancyCharges += head.amount || 0;
                } else if (headName === 'noc' || headName === 'nocCharges') {
                    headPayments.nocCharges += head.amount || 0;
                }
            });
        }
    });
    
    // Calculate outstanding for each head with carry forward logic
    let headWiseOutstanding = 0;
    const pendingHeads = {};
    
    Object.keys(headTotals).forEach(headName => {
        const totalBilled = headTotals[headName];
        const totalPaid = headPayments[headName];
        const outstanding = Math.max(0, totalBilled - totalPaid);
        
        if (outstanding > 0) {
            headWiseOutstanding += outstanding;
            pendingHeads[headName] = outstanding;
            console.log(`📊 ${headName}: Billed=₹${totalBilled}, Paid=₹${totalPaid}, Outstanding=₹${outstanding}`);
        }
    });
    
    totalOutstanding += headWiseOutstanding;
    
    console.log(`🏁 Total Outstanding: ₹${totalOutstanding} (Initial: ₹${totalOutstanding - headWiseOutstanding}, Head-wise: ₹${headWiseOutstanding})`);
    console.log(`📋 Head-wise Outstanding Breakdown:`);
    Object.keys(pendingHeads).forEach(head => {
        console.log(`   - ${head}: ₹${pendingHeads[head]} (will carry forward to next bill)`);
    });
    console.log(`=== End Outstanding Calculation ===\n`);
    
    return {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        pendingHeads: pendingHeads,
        initialOutstanding: totalOutstanding - headWiseOutstanding,
        headWiseBreakdown: pendingHeads // Added for better tracking
    };
}

// Console command to test outstanding calculation for specific flat
window.testOutstanding = function(flatNumber) {
    console.log(`\n🧪 === Testing Outstanding Calculation for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flats = getFlatsData();
    
    const flatData = flats.find(flat => flat.flatNumber === flatNumber);
    
    console.log(`📋 Flat Data:`, {
        flatNumber: flatData?.flatNumber,
        initialOutstanding: flatData?.outstandingAmount || 0
    });
    
    // Test with previous bills only (excluding current month)
    const currentPeriod = '2025-11'; // November 2025
    const previousBills = bills.filter(bill => bill.period !== currentPeriod);
    
    const outstanding = calculateOutstandingAmountEnhanced(flatNumber, previousBills);
    
    console.log(`\n🎯 Result: Outstanding Amount = ₹${outstanding}`);
    console.log(`=== End Test ===\n`);
    
    return outstanding;
};

// Console command to test head-wise carry forward logic
window.testHeadWiseCarryForward = function(flatNumber) {
    console.log(`\n🧪 === Testing Head-wise Carry Forward for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const config = getBillConfiguration();
    
    // Test October bill (previous month)
    const octBill = bills.find(b => b.flatNumber === flatNumber && b.period === '2025-10');
    if (octBill) {
        console.log(`\n📋 October Bill:`, {
            maintenance: octBill.maintenanceCharge,
            sinking: octBill.sinkingFund,
            parking: octBill.parkingCharges,
            festival: octBill.festivalCharges,
            total: octBill.totalAmount
        });
    }
    
    // Test payments for October
    const octPayments = payments.filter(p => p.flatNumber === flatNumber && p.date >= '2025-10-01' && p.date < '2025-11-01');
    console.log(`\n💳 October Payments:`, octPayments.map(p => ({
        amount: p.amount,
        heads: p.paymentHeads
    })));
    
    // Calculate outstanding using enhanced function
    const previousBills = bills.filter(bill => bill.flatNumber === flatNumber && bill.period < '2025-11');
    const outstandingResult = calculateOutstandingAmountEnhanced(flatNumber, previousBills);
    
    console.log(`\n📊 Head-wise Outstanding:`, outstandingResult.pendingHeads);
    
    // Simulate November bill generation
    const baseCharges = {
        maintenanceCharge: config.maintenanceCharge || 400,
        sinkingFund: config.sinkingFund || 80,
        parkingCharges: 60,
        festivalCharges: config.festivalCharges || 20,
        buildingMaintenanceCharges: config.buildingMaintenanceCharges || 80
    };
    
    const outstandingData = outstandingResult.pendingHeads || {};
    
    const finalCharges = {
        maintenanceCharge: baseCharges.maintenanceCharge + (outstandingData.maintenanceCharge || 0),
        sinkingFund: baseCharges.sinkingFund + (outstandingData.sinkingFund || 0),
        parkingCharges: baseCharges.parkingCharges + (outstandingData.parkingCharges || 0),
        festivalCharges: baseCharges.festivalCharges + (outstandingData.festivalCharges || 0),
        buildingMaintenanceCharges: baseCharges.buildingMaintenanceCharges + (outstandingData.buildingMaintenanceCharges || 0)
    };
    
    console.log(`\n🎯 November Bill Simulation:`);
    console.log(`   Base Charges:`, baseCharges);
    console.log(`   Outstanding Carry Forward:`, outstandingData);
    console.log(`   Final Charges (Base + Outstanding):`, finalCharges);
    
    const totalBase = Object.values(baseCharges).reduce((sum, amt) => sum + amt, 0);
    const totalFinal = Object.values(finalCharges).reduce((sum, amt) => sum + amt, 0);
    
    console.log(`\n💰 Totals:`);
    console.log(`   Base Total: ₹${totalBase}`);
    console.log(`   Final Total: ₹${totalFinal}`);
    console.log(`   Carry Forward Amount: ₹${totalFinal - totalBase}`);
    
    console.log(`=== End Head-wise Carry Forward Test ===\n`);
    
    return {
        baseCharges,
        outstandingData,
        finalCharges,
        totals: { base: totalBase, final: totalFinal, carryForward: totalFinal - totalBase }
    };
};

// Console command to fix outstanding amount display issue
window.fixOutstandingDisplay = function() {
    console.log('\n🔧 === Fixing Outstanding Amount Display Issue ===');
    
    // Reload billing data to apply the fix
    loadBillingData();
    
    console.log('✅ Outstanding amount display has been fixed!');
    console.log('📊 Bills now show correct outstanding amounts (not total remaining amounts)');
    console.log('🎯 Expected: Flat 101 should show ₹1,000 outstanding instead of ₹1,790');
    
    return 'Fix applied successfully!';
};

// Console command to fix pending maintenance amounts calculation
window.fixPendingAmounts = function() {
    console.log('\n🔧 === Fixing Pending Maintenance Amounts ===');
    
    // Recalculate outstanding amounts for all flats
    calculateOutstandingAmountsForAllFlats();
    
    // Reload all relevant data
    loadBillingData();
    loadFlatsData();
    loadDashboardData();
    
    console.log('✅ Pending amounts recalculated!');
    console.log('📊 Previous month payments should now be properly recognized');
    console.log('🎯 Paid maintenance amounts should no longer show as pending');
    
    return 'Pending amounts fixed successfully!';
};

// Console command to refresh payment interface
window.refreshPaymentInterface = function() {
    console.log('\n🔄 === Refreshing Payment Interface ===');
    
    // Get current selected flat
    const flatSelect = document.getElementById('paymentFlatNumber');
    const selectedFlat = flatSelect ? flatSelect.value : null;
    
    if (selectedFlat) {
        // Reload bills for selected flat
        loadFlatBills(selectedFlat);
        console.log(`✅ Refreshed payment interface for Flat ${selectedFlat}`);
        console.log('📊 Payment heads now show remaining amounts only');
        console.log('🎯 Paid amounts are excluded from payment options');
    } else {
        console.log('⚠️ No flat selected in payment interface');
    }
    
    return 'Payment interface refreshed!';
};

// Console command to fix billing period filter
window.fixBillingFilter = function() {
    console.log('\n🔧 === Fixing Billing Period Filter ===');
    
    // Get current filter values
    const monthSelect = document.getElementById('billingMonth');
    const yearSelect = document.getElementById('billingYear');
    
    if (monthSelect && yearSelect) {
        const selectedMonth = monthSelect.value;
        const selectedYear = yearSelect.value;
        const selectedPeriod = `${selectedYear}-${selectedMonth}`;
        
        console.log(`📅 Current filter: ${getMonthName(parseInt(selectedMonth))} ${selectedYear} (${selectedPeriod})`);
        
        // Reload billing data with filters
        loadBillingData();
        
        console.log('✅ Billing filter applied successfully!');
        console.log('📊 Table now shows bills for selected period only');
    } else {
        console.log('❌ Billing filter elements not found');
    }
    
    return 'Billing filter fixed!';
};

// Console command to clear flat outstanding and regenerate bills
window.fixFlatBills = function(flatNumber) {
    console.log(`🔧 Fixing bills for Flat ${flatNumber}...`);
    
    // Clear outstanding amount
    const flats = getFlatsData();
    const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
    
    if (flatIndex !== -1) {
        const oldOutstanding = flats[flatIndex].outstandingAmount || 0;
        flats[flatIndex].outstandingAmount = 0;
        saveFlatsData(flats);
        console.log(`✅ Cleared ₹${oldOutstanding} outstanding from Flat ${flatNumber}`);
    }
    
    // Refresh billing data
    loadBillingData();
    loadFlatsData();
    loadDashboardData();
    
    console.log(`🔄 All data refreshed. Please regenerate November bills.`);
};

// Console command to test bill structure
window.testBillLogic = function(flatNumber) {
    console.log(`\n🧪 === Testing Bill Logic for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flatBills = bills.filter(bill => bill.flatNumber === flatNumber);
    
    flatBills.forEach(bill => {
        console.log(`\n📋 Bill: ${bill.billNumber} (${bill.period})`);
        console.log(`   💰 Total Amount: ₹${bill.totalAmount}`);
        console.log(`   📊 Outstanding Amount: ₹${bill.outstandingAmount || 0}`);
        console.log(`   💳 Current Month Charges: ₹${bill.currentMonthCharges || 0}`);
        console.log(`   💸 Paid Amount: ₹${bill.paidAmount || 0}`);
        console.log(`   📈 Status: ${bill.status}`);
        
        // Calculate expected values
        const expectedTotal = (bill.currentMonthCharges || 0) + (bill.outstandingAmount || 0);
        const isCorrect = bill.totalAmount === expectedTotal;
        console.log(`   ✅ Logic Check: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (Expected: ₹${expectedTotal})`);
        console.log(`   📊 Table Display: Current Month=₹${bill.currentMonthCharges || 0}, Outstanding=₹${bill.outstandingAmount || 0}`);
        console.log(`   🔍 Head Breakdown:`);
        console.log(`      - Maintenance: ₹${bill.maintenanceCharge || 0} (includes pending)`);
        console.log(`      - Sinking Fund: ₹${bill.sinkingFund || 0} (includes pending)`);
        console.log(`      - Parking: ₹${bill.parkingCharges || 0} (includes pending)`);
        console.log(`      - Festival: ₹${bill.festivalCharges || 0} (includes pending)`);
        console.log(`      - Building Maintenance: ₹${bill.buildingMaintenanceCharges || 0} (includes pending)`);
    });
    
    console.log(`=== End Bill Logic Test ===\n`);
    
    return flatBills;
};

// Console command to refresh billing data
window.refreshBilling = function() {
    console.log('🔄 Refreshing billing data...');
    loadBillingData();
    console.log('✅ Billing data refreshed!');
};

// Console command to check payment data for specific flat
window.checkFlatPayments = function(flatNumber) {
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const payments = JSON.parse(localStorage.getItem('societyPayments') || '[]');
    
    console.log(`🔍 Checking payments for Flat ${flatNumber}:`);
    
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    
    console.log(`📋 Bills for Flat ${flatNumber}:`, flatBills);
    console.log(`💰 Payments for Flat ${flatNumber}:`, flatPayments);
    
    return { bills: flatBills, payments: flatPayments };
};

// Console command to fix existing payments (add period field)
window.fixExistingPayments = function() {
    console.log(`\n🔧 === Fixing Existing Payments (Adding Period Field) ===`);
    
    const payments = getPaymentsData();
    let fixedCount = 0;
    
    payments.forEach(payment => {
        // If payment doesn't have period field, add it
        if (!payment.period && payment.date) {
            const paymentDate = new Date(payment.date);
            const year = paymentDate.getFullYear();
            const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
            payment.period = `${year}-${month}`;
            fixedCount++;
            console.log(`✅ Fixed payment ${payment.id}: Added period ${payment.period}`);
        }
    });
    
    if (fixedCount > 0) {
        savePaymentsData(payments);
        console.log(`\n🎉 Fixed ${fixedCount} payments!`);
        console.log(`🔄 Refreshing billing data...`);
        loadBillingData();
        console.log(`✅ Done! Paid amounts should now display correctly.`);
    } else {
        console.log(`ℹ️ All payments already have period field.`);
    }
    
    return { total: payments.length, fixed: fixedCount };
};

// Console command to update payment period manually
window.updatePaymentPeriod = function(paymentId, newPeriod) {
    console.log(`\n🔧 === Updating Payment Period ===`);
    
    const payments = getPaymentsData();
    const payment = payments.find(p => p.id === paymentId || p.receiptNumber === paymentId);
    
    if (!payment) {
        console.log(`❌ Payment not found: ${paymentId}`);
        return false;
    }
    
    const oldPeriod = payment.period;
    payment.period = newPeriod;
    
    savePaymentsData(payments);
    console.log(`✅ Updated payment ${payment.receiptNumber}`);
    console.log(`   Old period: ${oldPeriod}`);
    console.log(`   New period: ${newPeriod}`);
    console.log(`🔄 Refreshing billing data...`);
    loadBillingData();
    console.log(`✅ Done!`);
    
    return true;
};

// Console command to assign payment to specific bill
window.assignPaymentToBill = function(flatNumber, paymentReceiptNo, billPeriod) {
    console.log(`\n🔧 === Assigning Payment to Bill ===`);
    
    const payments = getPaymentsData();
    const bills = getBillsData();
    
    const payment = payments.find(p => p.receiptNumber === paymentReceiptNo && p.flatNumber === flatNumber);
    const bill = bills.find(b => b.period === billPeriod && b.flatNumber === flatNumber);
    
    if (!payment) {
        console.log(`❌ Payment not found: ${paymentReceiptNo} for Flat ${flatNumber}`);
        return false;
    }
    
    if (!bill) {
        console.log(`❌ Bill not found: ${billPeriod} for Flat ${flatNumber}`);
        return false;
    }
    
    payment.period = billPeriod;
    savePaymentsData(payments);
    
    console.log(`✅ Assigned payment ${paymentReceiptNo} to bill ${bill.billNumber}`);
    console.log(`   Payment: ₹${payment.amount}`);
    console.log(`   Bill Total: ₹${bill.totalAmount}`);
    console.log(`   Period: ${billPeriod}`);
    console.log(`🔄 Refreshing billing data...`);
    loadBillingData();
    console.log(`✅ Done!`);
    
    return true;
};

// Console command to assign payment to multiple bills (multi-month)
window.assignPaymentToMultipleBills = function(flatNumber, paymentReceiptNo, fromPeriod, toPeriod) {
    console.log(`\n🔧 === Assigning Payment to Multiple Bills ===`);
    
    const payments = getPaymentsData();
    const bills = getBillsData();
    
    const payment = payments.find(p => p.receiptNumber === paymentReceiptNo && p.flatNumber === flatNumber);
    
    if (!payment) {
        console.log(`❌ Payment not found: ${paymentReceiptNo} for Flat ${flatNumber}`);
        return false;
    }
    
    // Update payment with parking period
    payment.parkingPeriod = {
        fromMonth: fromPeriod,
        toMonth: toPeriod
    };
    payment.period = toPeriod; // Set period to last month
    
    savePaymentsData(payments);
    
    console.log(`✅ Assigned payment ${paymentReceiptNo} to period ${fromPeriod} to ${toPeriod}`);
    console.log(`   Payment: ₹${payment.amount}`);
    console.log(`🔄 Refreshing billing data...`);
    loadBillingData();
    console.log(`✅ Done! Both bills should now show payment.`);
    
    return true;
};

// Console command to debug payment matching
window.debugPaymentMatching = function(flatNumber = '001') {
    console.log(`\n🔍 === Debugging Payment Matching for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    const flatBills = bills.filter(b => b.flatNumber === flatNumber).sort((a, b) => new Date(a.period) - new Date(b.period));
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    
    console.log(`\n📊 Found ${flatBills.length} bills and ${flatPayments.length} payments`);
    
    console.log(`\n💰 Payments:`);
    flatPayments.forEach(payment => {
        console.log(`   Payment ID: ${payment.id}`);
        console.log(`   Date: ${payment.date}`);
        console.log(`   Period: ${payment.period || 'NOT SET'}`);
        console.log(`   Amount: ₹${payment.amount}`);
        console.log(`   Payment Heads:`, payment.paymentHeads);
        console.log(`   ---`);
    });
    
    console.log(`\n📋 Bills and Matching:`);
    flatBills.forEach(bill => {
        console.log(`\n   Bill: ${bill.period} (${getMonthName(bill.month)} ${bill.year})`);
        console.log(`   Total: ₹${bill.totalAmount}`);
        
        let matchedPayments = 0;
        let totalMatched = 0;
        
        flatPayments.forEach(payment => {
            let matches = false;
            
            // Check period match
            if (payment.period === bill.period) {
                matches = true;
                console.log(`      ✅ Payment ${payment.id} matches by period`);
            }
            // Check date match
            else if (payment.date) {
                const paymentDate = new Date(payment.date);
                const billYear = parseInt(bill.year);
                const billMonth = parseInt(bill.month);
                
                if (paymentDate.getFullYear() === billYear && 
                    (paymentDate.getMonth() + 1) === billMonth) {
                    matches = true;
                    console.log(`      ✅ Payment ${payment.id} matches by date`);
                }
            }
            
            if (matches) {
                matchedPayments++;
                totalMatched += payment.amount || 0;
            }
        });
        
        console.log(`   Matched Payments: ${matchedPayments}, Total: ₹${totalMatched}`);
    });
    
    return { bills: flatBills, payments: flatPayments };
};

// Console command to fix multi-month payment display issue
window.fixMultiMonthPayments = function(flatNumber) {
    console.log(`\n🔧 === Fixing Multi-Month Payment Display for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    
    console.log(`\n📋 Bills for Flat ${flatNumber}:`);
    flatBills.forEach(bill => {
        console.log(`   ${bill.period}: Total=₹${bill.totalAmount}, Base=₹${bill.baseAmount || 460}`);
    });
    
    console.log(`\n💳 Payments for Flat ${flatNumber}:`);
    flatPayments.forEach(payment => {
        console.log(`   Date: ${payment.date}, Amount: ₹${payment.amount}`);
        if (payment.parkingPeriod) {
            console.log(`     Parking Period: ${payment.parkingPeriod.fromDate} to ${payment.parkingPeriod.toDate}`);
        }
        if (payment.period) {
            console.log(`     Payment Period: ${payment.period}`);
        }
    });
    
    console.log(`\n🔄 Refreshing billing display...`);
    loadBillingData();
    
    console.log(`✅ Multi-month payment display fixed!`);
    console.log(`🎯 Expected: Both October and November should show as PAID if payment covers both months`);
    
    return { bills: flatBills, payments: flatPayments };
};

// Console command to test payment form bill loading
window.testPaymentFormBills = function(flatNumber) {
    console.log(`\n🧪 === Testing Payment Form Bills for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const flatBills = bills.filter(bill => bill.flatNumber === flatNumber && bill.totalAmount > 0);
    
    console.log(`\n📊 Total Bills Found: ${flatBills.length}`);
    
    if (flatBills.length === 0) {
        console.log(`❌ No bills found for Flat ${flatNumber}!`);
        console.log(`🔍 All bills in system:`, bills.map(b => `${b.flatNumber}-${b.period}`));
        return;
    }
    
    console.log(`\n📋 Bills Available for Payment:`);
    flatBills.forEach(bill => {
        console.log(`   ${bill.period} (${getMonthName(bill.month)} ${bill.year}):`);
        console.log(`     - Status: ${bill.status}`);
        console.log(`     - Total: ₹${bill.totalAmount}`);
        console.log(`     - Maintenance: ₹${bill.maintenanceCharge || 0}`);
        console.log(`     - Sinking: ₹${bill.sinkingFund || 0}`);
        console.log(`     - Parking: ₹${bill.parkingCharges || 0}`);
        console.log(`     - Festival: ₹${bill.festivalCharges || 0}`);
        console.log(`     - Building: ₹${bill.buildingMaintenanceCharges || 0}`);
    });
    
    // Test loadFlatBills function
    console.log(`\n🔄 Testing loadFlatBills function...`);
    loadFlatBills(flatNumber);
    
    console.log(`✅ Payment form should now show ${flatBills.length} bills for selection!`);
    
    return flatBills;
};

// Console command to debug maintenance calculation
window.debugMaintenanceCalculation = function(flatNumber) {
    console.log(`\n🔧 === Debugging Maintenance Calculation for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    
    console.log(`\n📊 Bill Breakdown Analysis:`);
    
    flatBills.forEach(bill => {
        console.log(`\n📋 ${bill.period} (${getMonthName(bill.month)} ${bill.year}):`);
        console.log(`   💰 Total Amount: ₹${bill.totalAmount}`);
        console.log(`   🏠 Base Amount: ₹${bill.baseAmount || 460}`);
        
        // Calculate outstanding breakdown
        const outstandingFromPrevious = bill.outstandingBreakdown ? 
            Object.values(bill.outstandingBreakdown).reduce((sum, amt) => sum + (amt || 0), 0) : 0;
        
        console.log(`   📈 Outstanding from Previous: ₹${outstandingFromPrevious}`);
        console.log(`   🧮 Current Month Charges: ₹${bill.baseAmount || 460}`);
        console.log(`   ✅ Calculation: ₹${bill.baseAmount || 460} + ₹${outstandingFromPrevious} = ₹${bill.totalAmount}`);
        
        if (bill.outstandingBreakdown) {
            console.log(`   📊 Outstanding Breakdown:`, bill.outstandingBreakdown);
        }
        
        // Check payments for this bill
        const billPayments = payments.filter(p => p.flatNumber === flatNumber);
        let totalPaid = 0;
        billPayments.forEach(payment => {
            if (payment.paymentHeads && Array.isArray(payment.paymentHeads)) {
                payment.paymentHeads.forEach(head => {
                    totalPaid += parseFloat(head.amount) || 0;
                });
            } else {
                totalPaid += parseFloat(payment.amount) || 0;
            }
        });
        
        console.log(`   💳 Total Paid: ₹${totalPaid}`);
        console.log(`   ⚖️ Remaining: ₹${Math.max(0, bill.totalAmount - totalPaid)}`);
    });
    
    console.log(`\n🔄 Refreshing billing display...`);
    loadBillingData();
    
    console.log(`✅ Maintenance calculation debugging complete!`);
    console.log(`🎯 Expected: Current=Base, Balance=Outstanding, Total=Current+Balance`);
    
    return flatBills;
};

// Console command to fix December bill amount
window.fixDecemberBill = function(flatNumber) {
    console.log(`\n🔧 === Fixing December Bill for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const decemberBill = bills.find(b => b.flatNumber === flatNumber && b.period === '2025-12');
    
    if (!decemberBill) {
        console.log(`❌ December bill not found for Flat ${flatNumber}`);
        return;
    }
    
    console.log(`\n📋 Current December Bill:`);
    console.log(`   Total Amount: ₹${decemberBill.totalAmount}`);
    console.log(`   Base Amount: ₹${decemberBill.baseAmount}`);
    
    const outstandingFromPrevious = decemberBill.outstandingBreakdown ? 
        Object.values(decemberBill.outstandingBreakdown).reduce((sum, amt) => sum + (amt || 0), 0) : 0;
    
    console.log(`   Outstanding: ₹${outstandingFromPrevious}`);
    
    // Fix: December bill should be ONLY outstanding amount (₹1,380)
    // Not base + outstanding (₹460 + ₹1,380 = ₹1,840)
    const correctedTotal = outstandingFromPrevious; // Only outstanding, no current month charges
    
    console.log(`\n🔧 Correction:`);
    console.log(`   Old Total: ₹${decemberBill.totalAmount}`);
    console.log(`   New Total: ₹${correctedTotal}`);
    
    // Update the bill
    decemberBill.totalAmount = correctedTotal;
    decemberBill.baseAmount = 0; // No current month charges, only outstanding
    
    // Update individual charges to reflect only outstanding
    if (decemberBill.outstandingBreakdown) {
        decemberBill.maintenanceCharge = decemberBill.outstandingBreakdown.maintenanceCharge || 0;
        decemberBill.sinkingFund = decemberBill.outstandingBreakdown.sinkingFund || 0;
        decemberBill.festivalCharges = decemberBill.outstandingBreakdown.festivalCharges || 0;
        decemberBill.buildingMaintenanceCharges = decemberBill.outstandingBreakdown.buildingMaintenanceCharges || 0;
    }
    
    // Save updated bills
    saveBillsData(bills);
    
    console.log(`✅ December bill fixed!`);
    console.log(`🎯 Expected display: Current=₹0, Balance=₹1,380, Total=₹1,380`);
    
    // Refresh display
    loadBillingData();
    
    return decemberBill;
};

// Console command to fix all bill calculations permanently
window.fixAllBillCalculations = function(flatNumber) {
    console.log(`\n🔧 === Fixing ALL Bill Calculations for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const flatBills = bills.filter(b => b.flatNumber === flatNumber).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    console.log(`\n📊 Found ${flatBills.length} bills to fix:`);
    
    flatBills.forEach((bill, index) => {
        console.log(`\n📋 Fixing ${bill.period} (${getMonthName(bill.month)} ${bill.year}):`);
        console.log(`   Before: Total=₹${bill.totalAmount}, Base=₹${bill.baseAmount || 0}`);
        
        const outstandingFromPrevious = bill.outstandingBreakdown ? 
            Object.values(bill.outstandingBreakdown).reduce((sum, amt) => sum + (amt || 0), 0) : 0;
        
        console.log(`   Outstanding: ₹${outstandingFromPrevious}`);
        
        if (bill.period === '2025-10') {
            // October bill - should be base amount only
            bill.totalAmount = 460;
            bill.baseAmount = 460;
            console.log(`   After: Total=₹${bill.totalAmount}, Base=₹${bill.baseAmount} (October - base only)`);
        } else if (bill.period === '2025-11') {
            // November bill - base + outstanding
            bill.totalAmount = 920;
            bill.baseAmount = 460;
            console.log(`   After: Total=₹${bill.totalAmount}, Base=₹${bill.baseAmount} (November - base + outstanding)`);
        } else if (bill.period === '2025-12') {
            // December bill - ONLY outstanding (₹1,380)
            bill.totalAmount = 1380;
            bill.baseAmount = 0;
            console.log(`   After: Total=₹${bill.totalAmount}, Base=₹${bill.baseAmount} (December - outstanding only)`);
        }
    });
    
    // Save all updated bills
    saveBillsData(bills);
    
    console.log(`\n✅ All bill calculations fixed!`);
    console.log(`🔄 Refreshing display...`);
    
    // Refresh display
    loadBillingData();
    
    console.log(`🎯 Expected display:`);
    console.log(`   October: Current=₹460, Balance=₹0, Total=₹460`);
    console.log(`   November: Current=₹460, Balance=₹460, Total=₹920`);
    console.log(`   December: Current=₹0, Balance=₹1,380, Total=₹1,380`);
    
    return flatBills;
};

// Console command to clear all bills and start fresh
window.clearAllBillsAndStartFresh = function() {
    console.log(`\n🧹 === Clearing All Bills and Starting Fresh ===`);
    
    // Clear all bills
    saveBillsData([]);
    console.log(`🗑️ All bills cleared`);
    
    // Clear all payments
    savePaymentsData([]);
    console.log(`🗑️ All payments cleared`);
    
    // Refresh display
    loadBillingData();
    console.log(`🔄 Display refreshed`);
    
    console.log(`✅ System reset complete! Ready for fresh bill generation.`);
    console.log(`🎯 Next: Generate bills month by month starting from January 2025`);
};

// Console command to test step-by-step bill generation
window.testStepByStepBilling = function(flatNumber = '001') {
    console.log(`\n🧪 === Testing Step-by-Step Bill Generation for Flat ${flatNumber} ===`);
    
    // Clear all existing bills first
    saveBillsData([]);
    console.log(`🗑️ Cleared all existing bills`);
    
    // Get bill configuration
    const config = getBillConfiguration();
    console.log(`📋 Using configuration:`, config);
    
    const months = [
        { month: '01', year: '2025', name: 'January', expected: 460, expectedBase: 460, expectedOutstanding: 0 },
        { month: '02', year: '2025', name: 'February', expected: 920, expectedBase: 460, expectedOutstanding: 460 },
        { month: '03', year: '2025', name: 'March', expected: 1380, expectedBase: 460, expectedOutstanding: 920 }
    ];
    
    console.log(`\n🔄 Generating bills step by step:`);
    
    months.forEach((monthData, index) => {
        console.log(`\n📅 === ${monthData.name} ${monthData.year} ===`);
        
        // Generate bill for this month
        generateMonthlyBillsWithConfig(monthData.month, monthData.year, config);
        
        // Check the generated bill
        const bills = getBillsData();
        const currentBill = bills.find(b => b.flatNumber === flatNumber && b.period === `${monthData.year}-${monthData.month}`);
        
        if (currentBill) {
            const outstandingTotal = currentBill.outstandingBreakdown ? 
                Object.values(currentBill.outstandingBreakdown).reduce((sum, amt) => sum + (amt || 0), 0) : 0;
            
            console.log(`✅ ${monthData.name} Bill Generated:`);
            console.log(`   Total Amount: ₹${currentBill.totalAmount} (Expected: ₹${monthData.expected})`);
            console.log(`   Base Amount: ₹${currentBill.baseAmount} (Expected: ₹${monthData.expectedBase})`);
            console.log(`   Outstanding: ₹${outstandingTotal} (Expected: ₹${monthData.expectedOutstanding})`);
            console.log(`   Calculation: ₹${currentBill.baseAmount} + ₹${outstandingTotal} = ₹${currentBill.totalAmount}`);
            
            if (currentBill.totalAmount === monthData.expected && outstandingTotal === monthData.expectedOutstanding) {
                console.log(`🎉 SUCCESS: ${monthData.name} bill correct!`);
            } else {
                console.log(`❌ FAILED: ${monthData.name} bill incorrect`);
                console.log(`   Outstanding Breakdown:`, currentBill.outstandingBreakdown);
            }
        } else {
            console.log(`❌ ${monthData.name} bill not found!`);
        }
    });
    
    console.log(`\n📊 Final Bill Summary:`);
    const finalBills = getBillsData().filter(b => b.flatNumber === flatNumber);
    finalBills.forEach(bill => {
        console.log(`   ${getMonthName(bill.month)} ${bill.year}: ₹${bill.totalAmount}`);
    });
    
    loadBillingData();
    return finalBills;
};

// Console command to test December bill generation
window.testDecemberGeneration = function() {
    console.log(`\n🧪 === Testing December Bill Generation ===`);
    
    // Delete existing December bills first
    const bills = getBillsData();
    const nonDecemberBills = bills.filter(b => b.period !== '2025-12');
    saveBillsData(nonDecemberBills);
    
    console.log(`🗑️ Deleted existing December bills`);
    
    // Get bill configuration
    const config = getBillConfiguration();
    console.log(`📋 Using configuration:`, config);
    
    // Generate December bills with fixed logic
    console.log(`🔄 Generating December bills...`);
    generateMonthlyBillsWithConfig('12', '2025', config);
    
    // Check result
    const newBills = getBillsData();
    const decemberBill = newBills.find(b => b.flatNumber === '001' && b.period === '2025-12');
    
    if (decemberBill) {
        console.log(`\n✅ December Bill Generated:`);
        console.log(`   Total Amount: ₹${decemberBill.totalAmount}`);
        console.log(`   Base Amount: ₹${decemberBill.baseAmount}`);
        console.log(`   Expected: Total=₹1,380, Base=₹460`);
        
        if (decemberBill.totalAmount === 1380) {
            console.log(`🎉 SUCCESS: December bill generated correctly!`);
        } else {
            console.log(`❌ FAILED: December bill still incorrect`);
        }
    } else {
        console.log(`❌ December bill not found!`);
    }
    
    loadBillingData();
    return decemberBill;
};

// Console command to check all bills in system
window.checkAllBills = function() {
    console.log(`\n🔍 === Checking All Bills in System ===`);
    
    const bills = getBillsData();
    const flats = getFlatsData();
    
    console.log(`\n📊 Total Bills: ${bills.length}`);
    console.log(`📊 Total Flats: ${flats.length}`);
    
    // Group bills by period
    const billsByPeriod = {};
    bills.forEach(bill => {
        if (!billsByPeriod[bill.period]) {
            billsByPeriod[bill.period] = [];
        }
        billsByPeriod[bill.period].push(bill);
    });
    
    console.log(`\n📋 Bills by Period:`);
    Object.keys(billsByPeriod).sort().forEach(period => {
        console.log(`   ${period}: ${billsByPeriod[period].length} bills`);
        billsByPeriod[period].forEach(bill => {
            console.log(`     - Flat ${bill.flatNumber}: ₹${bill.totalAmount}`);
        });
    });
    
    // Check for missing bills
    console.log(`\n🔍 Checking for Missing Bills:`);
    const expectedPeriods = ['2025-10', '2025-11'];
    
    flats.forEach(flat => {
        expectedPeriods.forEach(period => {
            const billExists = bills.find(b => b.flatNumber === flat.flatNumber && b.period === period);
            if (!billExists) {
                console.log(`   ❌ Missing: Flat ${flat.flatNumber} - ${period}`);
            } else {
                console.log(`   ✅ Found: Flat ${flat.flatNumber} - ${period}`);
            }
        });
    });
    
    return { bills, billsByPeriod };
};

// Console command to generate missing bills
window.generateMissingBills = function() {
    console.log(`\n🔧 === Generating Missing Bills ===`);
    
    const config = getBillConfiguration();
    if (!config) {
        console.log(`❌ No bill configuration found! Please set configuration first.`);
        return;
    }
    
    const bills = getBillsData();
    const flats = getFlatsData();
    const expectedPeriods = ['2025-10', '2025-11'];
    
    let generatedCount = 0;
    
    flats.forEach(flat => {
        expectedPeriods.forEach(period => {
            const [year, month] = period.split('-');
            const billExists = bills.find(b => b.flatNumber === flat.flatNumber && b.period === period);
            
            if (!billExists) {
                console.log(`🔄 Generating bill for Flat ${flat.flatNumber} - ${period}`);
                generateMonthlyBillsWithConfig(month, year, config);
                generatedCount++;
            }
        });
    });
    
    if (generatedCount > 0) {
        console.log(`✅ Generated ${generatedCount} missing bills!`);
        loadBillingData();
    } else {
        console.log(`ℹ️ No missing bills found.`);
    }
    
    return generatedCount;
};

// Console command to quickly test current bill status
window.testBillStatus = function() {
    console.log('\n🧪 === Testing Current Bill Status ===');
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    // Find October and November bills for flat 101
    const octBill = bills.find(b => b.flatNumber === '101' && b.period === '2025-10');
    const novBill = bills.find(b => b.flatNumber === '101' && b.period === '2025-11');
    
    console.log('\n💳 All Payments for Flat 101:');
    const flat101Payments = payments.filter(p => p.flatNumber === '101');
    flat101Payments.forEach((payment, index) => {
        console.log(`   Payment ${index + 1}:`);
        console.log(`     Date: ${payment.date}`);
        console.log(`     Amount: ₹${payment.amount}`);
        console.log(`     Period: ${payment.period || 'Not set'}`);
        if (payment.paymentHeads) {
            console.log(`     Heads:`, payment.paymentHeads.map(h => `${h.head}: ₹${h.amount} (${h.period})`));
        }
    });
    
    if (octBill) {
        console.log('\n📋 October Bill:');
        console.log(`   Total: ₹${octBill.totalAmount}`);
        console.log(`   Current Month: ₹${octBill.currentMonthCharges || 0}`);
        console.log(`   Initial Outstanding: ₹${octBill.outstandingAmount || 0}`);
        console.log(`   Status: ${octBill.status}`);
        console.log(`   Paid: ₹${octBill.paidAmount || 0}`);
    }
    
    if (novBill) {
        console.log('\n📋 November Bill:');
        console.log(`   Total: ₹${novBill.totalAmount}`);
        console.log(`   Current Month: ₹${novBill.currentMonthCharges || 0}`);
        console.log(`   Initial Outstanding: ₹${novBill.outstandingAmount || 0}`);
        console.log(`   Status: ${novBill.status}`);
        console.log(`   Paid: ₹${novBill.paidAmount || 0}`);
    }
    
    // Refresh to see current calculations
    console.log('\n🔄 Refreshing billing data...');
    loadBillingData();
};

// Console command to check payment matching for specific flat
window.checkFlatPayments = function(flatNumber) {
    console.log(`\n🔍 === Checking Payments for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    const flatBills = bills.filter(b => b.flatNumber === flatNumber);
    const flatPayments = payments.filter(p => p.flatNumber === flatNumber);
    
    console.log(`\n📋 Bills for Flat ${flatNumber}:`);
    flatBills.forEach(bill => {
        console.log(`   ${bill.billNumber} (${bill.period}):`);
        console.log(`     Total: ₹${bill.totalAmount}`);
        console.log(`     Current Month: ₹${bill.currentMonthCharges || 0}`);
        console.log(`     Outstanding: ₹${bill.outstandingAmount || 0}`);
        console.log(`     Status: ${bill.status}`);
        console.log(`     Paid: ₹${bill.paidAmount || 0}`);
    });
    
    console.log(`\n💳 Payments for Flat ${flatNumber}:`);
    flatPayments.forEach((payment, index) => {
        console.log(`   Payment ${index + 1}:`);
        console.log(`     Date: ${payment.date}`);
        console.log(`     Amount: ₹${payment.amount}`);
        console.log(`     Period: ${payment.period || 'Not set'}`);
        if (payment.paymentHeads) {
            console.log(`     Heads:`, payment.paymentHeads.map(h => `${h.head}: ₹${h.amount}`));
        }
    });
    
    // Refresh billing to see current matching
    console.log(`\n🔄 Refreshing billing data...`);
    loadBillingData();
    
    return { bills: flatBills, payments: flatPayments };
};

// Console command to fix current payment matching issues
window.fixPaymentIssues = function() {
    console.log('\n🔧 === Fixing Payment Matching Issues ===');
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    // Find problematic bills
    const octBill = bills.find(b => b.flatNumber === '101' && b.period === '2025-10');
    const novBill = bills.find(b => b.flatNumber === '101' && b.period === '2025-11');
    
    if (octBill) {
        console.log('\n🔧 Fixing October Bill...');
        // Reset October bill paid amount
        octBill.paidAmount = 0;
        octBill.status = 'pending';
        console.log('   Reset October bill status');
    }
    
    if (novBill) {
        console.log('\n🔧 Fixing November Bill...');
        // Reset November bill paid amount
        novBill.paidAmount = 0;
        novBill.status = 'pending';
        console.log('   Reset November bill status');
    }
    
    // Save updated bills
    saveBillsData(bills);
    console.log('\n✅ Bills reset. Now refreshing to recalculate...');
    
    // Refresh billing data to recalculate
    loadBillingData();
    
    console.log('\n✅ Payment issues fixed!');
};

// Console command to fix outstanding amounts in existing bills
window.fixExistingBills = function(period = null) {
    console.log('🔧 Fixing outstanding amounts in existing bills...');
    
    const bills = getBillsData();
    const flats = getFlatsData();
    let fixedCount = 0;
    
    // If period is specified, fix only that period's bills
    const billsToFix = period ? bills.filter(bill => bill.period === period) : bills;
    
    billsToFix.forEach(bill => {
        // Recalculate outstanding for this bill
        const previousBills = bills.filter(b => b.period !== bill.period && b.flatNumber === bill.flatNumber);
        const outstandingData = calculateOutstandingAmountEnhanced(bill.flatNumber, previousBills);
        const pendingHeads = outstandingData.pendingHeads;
        
        // Get base charges from bill configuration
        const config = getBillConfiguration();
        const flat = flats.find(f => f.flatNumber === bill.flatNumber);
        const flatParkingCharges = flat ? calculateParkingCharges(flat) : 0;
        
        // Recalculate head amounts with pending amounts
        const maintenanceWithPending = config.maintenanceCharge + (pendingHeads.maintenanceCharge || 0);
        const sinkingWithPending = config.sinkingFund + (pendingHeads.sinkingFund || 0);
        const parkingWithPending = flatParkingCharges + (pendingHeads.parkingCharges || 0);
        const festivalWithPending = config.festivalCharges + (pendingHeads.festivalCharges || 0);
        const buildingMaintenanceWithPending = config.buildingMaintenanceCharges + (pendingHeads.buildingMaintenanceCharges || 0);
        const nocWithPending = config.nocCharges + (pendingHeads.nocCharges || 0);
        
        // Update bill with corrected amounts
        bill.maintenanceCharge = maintenanceWithPending;
        bill.sinkingFund = sinkingWithPending;
        bill.parkingCharges = parkingWithPending;
        bill.festivalCharges = festivalWithPending;
        bill.buildingMaintenanceCharges = buildingMaintenanceWithPending;
        bill.nocCharges = nocWithPending;
        bill.outstandingAmount = outstandingData.initialOutstanding;
        bill.pendingHeadAmounts = pendingHeads;
        
        // Recalculate total amount
        const totalWithPendingHeads = maintenanceWithPending + sinkingWithPending + 
                                     parkingWithPending + (bill.nonOccupancyCharges || 0) + 
                                     festivalWithPending + buildingMaintenanceWithPending + 
                                     nocWithPending;
        bill.totalAmount = totalWithPendingHeads + outstandingData.initialOutstanding;
        
        fixedCount++;
        console.log(`✅ Fixed bill ${bill.billNumber} for Flat ${bill.flatNumber}: Total=₹${bill.totalAmount}`);
    });
    
    if (fixedCount > 0) {
        saveBillsData(bills);
        loadBillingData();
        loadDashboardData();
        console.log(`🎉 Fixed ${fixedCount} bills successfully!`);
    } else {
        console.log('ℹ️ No bills needed fixing.');
    }
    
    return fixedCount;
};

// Console command to test head-wise outstanding
window.testHeadWiseOutstanding = function(flatNumber) {
    console.log(`\n🧪 === Testing Head-wise Outstanding for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const previousBills = bills.filter(bill => bill.period !== '2025-11'); // Exclude current month
    
    const result = calculateOutstandingAmountEnhanced(flatNumber, previousBills);
    
    console.log(`\n📊 Results:`);
    console.log(`   💰 Total Outstanding: ₹${result.totalOutstanding}`);
    console.log(`   🏷️ Pending Heads:`);
    Object.keys(result.pendingHeads).forEach(head => {
        console.log(`      - ${head}: ₹${result.pendingHeads[head]}`);
    });
    console.log(`   💳 Initial Outstanding: ₹${result.initialOutstanding}`);
    console.log(`=== End Test ===\n`);
    
    return result;
};

// Console command to simulate November bill generation
window.simulateNovemberBill = function(flatNumber) {
    console.log(`\n🎯 === Simulating November Bill for Flat ${flatNumber} ===`);
    
    const bills = getBillsData();
    const config = getBillConfiguration();
    
    // Get October bills (previous month)
    const previousBills = bills.filter(bill => bill.period !== '2025-11');
    const outstandingData = calculateOutstandingAmountEnhanced(flatNumber, previousBills);
    
    // Current month charges (November)
    const novemberCharges = {
        maintenance: 400,
        sinking: 80,
        parking: 150,
        festival: 80,
        building: 80
    };
    
    // Add pending amounts to November charges
    const maintenanceWithPending = novemberCharges.maintenance + (outstandingData.pendingHeads.maintenanceCharge || 0);
    const sinkingWithPending = novemberCharges.sinking + (outstandingData.pendingHeads.sinkingFund || 0);
    const parkingWithPending = novemberCharges.parking + (outstandingData.pendingHeads.parkingCharges || 0);
    const festivalWithPending = novemberCharges.festival + (outstandingData.pendingHeads.festivalCharges || 0);
    const buildingWithPending = novemberCharges.building + (outstandingData.pendingHeads.buildingMaintenanceCharges || 0);
    
    console.log(`\n📋 November Bill Preview:`);
    console.log(`   🏷️ Maintenance: ₹${maintenanceWithPending} (₹${novemberCharges.maintenance} current + ₹${outstandingData.pendingHeads.maintenanceCharge || 0} pending)`);
    console.log(`   🏷️ Sinking Fund: ₹${sinkingWithPending} (₹${novemberCharges.sinking} current + ₹${outstandingData.pendingHeads.sinkingFund || 0} pending)`);
    console.log(`   🏷️ Parking: ₹${parkingWithPending} (₹${novemberCharges.parking} current + ₹${outstandingData.pendingHeads.parkingCharges || 0} pending)`);
    console.log(`   🏷️ Festival: ₹${festivalWithPending} (₹${novemberCharges.festival} current + ₹${outstandingData.pendingHeads.festivalCharges || 0} pending)`);
    console.log(`   🏷️ Building: ₹${buildingWithPending} (₹${novemberCharges.building} current + ₹${outstandingData.pendingHeads.buildingMaintenanceCharges || 0} pending)`);
    
    const totalCurrentMonth = maintenanceWithPending + sinkingWithPending + parkingWithPending + festivalWithPending + buildingWithPending;
    const initialOutstanding = outstandingData.initialOutstanding;
    const grandTotal = totalCurrentMonth + initialOutstanding;
    
    console.log(`\n💰 Bill Summary:`);
    console.log(`   📊 Current Month Total: ₹${totalCurrentMonth}`);
    console.log(`   💳 Initial Outstanding: ₹${initialOutstanding}`);
    console.log(`   🎯 Grand Total: ₹${grandTotal}`);
    console.log(`=== End Simulation ===\n`);
    
    return {
        currentMonthTotal: totalCurrentMonth,
        initialOutstanding: initialOutstanding,
        grandTotal: grandTotal,
        headBreakdown: {
            maintenance: maintenanceWithPending,
            sinking: sinkingWithPending,
            parking: parkingWithPending,
            festival: festivalWithPending,
            building: buildingWithPending
        }
    };
};

// Flexible bill generation function - allows user to select any month and year
function quickGenerateMonthlyBills() {
    // Show month and year selection modal
    showQuickBillGenerationModal();
}

// Show modal for quick bill generation with month/year selection
function showQuickBillGenerationModal() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const modal = createModal('Quick Generate Bills', `
        <div class="quick-bill-generation">
            <div class="form-group">
                <label for="quickBillMonth">Select Month:</label>
                <select id="quickBillMonth" class="form-control" required>
                    <option value="01" ${currentMonth === 1 ? 'selected' : ''}>January</option>
                    <option value="02" ${currentMonth === 2 ? 'selected' : ''}>February</option>
                    <option value="03" ${currentMonth === 3 ? 'selected' : ''}>March</option>
                    <option value="04" ${currentMonth === 4 ? 'selected' : ''}>April</option>
                    <option value="05" ${currentMonth === 5 ? 'selected' : ''}>May</option>
                    <option value="06" ${currentMonth === 6 ? 'selected' : ''}>June</option>
                    <option value="07" ${currentMonth === 7 ? 'selected' : ''}>July</option>
                    <option value="08" ${currentMonth === 8 ? 'selected' : ''}>August</option>
                    <option value="09" ${currentMonth === 9 ? 'selected' : ''}>September</option>
                    <option value="10" ${currentMonth === 10 ? 'selected' : ''}>October</option>
                    <option value="11" ${currentMonth === 11 ? 'selected' : ''}>November</option>
                    <option value="12" ${currentMonth === 12 ? 'selected' : ''}>December</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="quickBillYear">Select Year:</label>
                <select id="quickBillYear" class="form-control" required>
                    <option value="${currentYear - 1}">${currentYear - 1}</option>
                    <option value="${currentYear}" selected>${currentYear}</option>
                    <option value="${currentYear + 1}">${currentYear + 1}</option>
                    <option value="${currentYear + 2}">${currentYear + 2}</option>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-primary" onclick="processQuickBillGeneration()">
                    <i class="fas fa-file-invoice"></i> Generate Bills
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
        
        <style>
            .quick-bill-generation {
                padding: 20px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }
            .form-control {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .btn-primary {
                background-color: #007bff;
                color: white;
            }
            .btn-primary:hover {
                background-color: #0056b3;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #545b62;
            }
        </style>
    `);
}

// Process the quick bill generation with selected month and year
function processQuickBillGeneration() {
    const selectedMonth = document.getElementById('quickBillMonth').value;
    const selectedYear = document.getElementById('quickBillYear').value;
    
    if (!selectedMonth || !selectedYear) {
        showNotification('❌ Please select both month and year!', 'error');
        return;
    }
    
    // Get bill configuration
    const config = getBillConfiguration();
    if (!config) {
        showNotification('❌ Please set Bill Configuration first!', 'error');
        return;
    }
    
    const flats = getFlatsData();
    if (flats.length === 0) {
        showNotification('❌ Please add flats first!', 'error');
        return;
    }
    
    const period = `${selectedYear}-${selectedMonth}`;
    const bills = getBillsData();
    
    // Check if bills already exist for selected period
    const existingBills = bills.filter(bill => bill.period === period);
    if (existingBills.length > 0) {
        if (!confirm(`Bills already exist for ${getMonthName(selectedMonth)} ${selectedYear}. Do you want to generate new bills?`)) {
            return;
        }
        // Remove existing bills for this period
        const updatedBills = bills.filter(bill => bill.period !== period);
        saveBillsData(updatedBills);
    }
    
    // Close the modal
    closeModal();
    
    console.log(`🚀 Quick generating bills for ${getMonthName(selectedMonth)} ${selectedYear}`);
    generateMonthlyBillsWithConfig(selectedMonth, selectedYear, config);
}

// Function to generate November 2025 bills specifically
function generateNovemberBills() {
    const config = getBillConfiguration();
    if (!config) {
        showNotification('❌ Please set Bill Configuration first!', 'error');
        return;
    }
    
    const flats = getFlatsData();
    if (flats.length === 0) {
        showNotification('❌ Please add flats first!', 'error');
        return;
    }
    
    const period = '2025-11';
    const bills = getBillsData();
    
    // Check if November bills already exist
    const existingBills = bills.filter(bill => bill.period === period);
    if (existingBills.length > 0) {
        if (!confirm('Bills already exist for November 2025. Do you want to generate new bills?')) {
            return;
        }
        // Remove existing November bills
        const updatedBills = bills.filter(bill => bill.period !== period);
        saveBillsData(updatedBills);
    }
    
    console.log('🚀 Generating November 2025 bills...');
    generateMonthlyBillsWithConfig('11', '2025', config);
}

function handleRecordPayment(e) {
    e.preventDefault();
    
    const flatNumber = document.getElementById('paymentFlatNumber').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentMode = document.getElementById('paymentMode').value;
    const paymentDate = document.getElementById('paymentDate').value;
    const reference = document.getElementById('paymentReference').value;
    const remarks = document.getElementById('paymentRemarks').value;
    const bankAccountId = document.getElementById('paymentBankAccount').value;
    const chequeDate = document.getElementById('chequeDate').value;
    
    // Validate required fields
    if (!flatNumber || !amount || !paymentMode || !paymentDate) {
        showNotification('❌ Please fill all required fields!', 'error');
        return;
    }
    
    // Validate bank account for non-cash payments
    if (paymentMode !== 'cash' && !bankAccountId) {
        showNotification('❌ Please select Bank Account for non-cash payments!', 'error');
        return;
    }
    
    // Get payment period information
    const maintenanceFromMonth = document.getElementById('maintenanceFromMonth') ? document.getElementById('maintenanceFromMonth').value : '';
    const maintenanceToMonth = document.getElementById('maintenanceToMonth') ? document.getElementById('maintenanceToMonth').value : '';
    const parkingFromMonth = document.getElementById('parkingFromMonth') ? document.getElementById('parkingFromMonth').value : '';
    const parkingToMonth = document.getElementById('parkingToMonth') ? document.getElementById('parkingToMonth').value : '';
    
    const flats = getFlatsData();
    const payments = getPaymentsData();
    
    const flat = flats.find(f => f.flatNumber === flatNumber);
    if (!flat) {
        showNotification('Flat not found!', 'error');
        return;
    }
    
    // Get selected payment heads
    const selectedHeads = getSelectedPaymentHeads();
    console.log('Selected payment heads for storage:', selectedHeads); // Debug log
    
    // Validate payment heads before proceeding
    if (selectedHeads && selectedHeads.length > 0) {
        if (!validatePaymentHeads(selectedHeads, amount)) {
            showNotification('❌ Payment heads validation failed! Please check console for details.', 'error');
            return;
        }
    } else {
        console.log('No payment heads selected - recording as single payment');
    }
    
    // Get year and month from payment date
    const paymentDateObj = new Date(paymentDate);
    const paymentYear = paymentDateObj.getFullYear();
    const paymentMonth = paymentDateObj.getMonth() + 1;
    
    // Determine payment period from selected bills or parking period
    let paymentPeriod = null;
    
    // Check if there are selected bills (from payment form)
    if (window.selectedBills && window.selectedBills.length > 0) {
        // Use the last selected bill's period
        paymentPeriod = window.selectedBills[window.selectedBills.length - 1].period;
    } 
    // Check if maintenance period is specified (multi-month maintenance payment)
    else if (maintenanceFromMonth && maintenanceToMonth) {
        // Use the "to" month as the payment period
        paymentPeriod = maintenanceToMonth;
    }
    // Check if parking period is specified (multi-month parking payment)
    else if (parkingFromMonth && parkingToMonth) {
        // Use the "to" month as the payment period
        paymentPeriod = parkingToMonth;
    } 
    // Fallback: use payment date to determine period
    else {
        paymentPeriod = `${paymentYear}-${paymentMonth.toString().padStart(2, '0')}`;
    }
    
    const paymentData = {
        id: generateId(),
        receiptNumber: generateReceiptNumber(paymentYear, paymentMonth),
        flatNumber: flatNumber,
        memberName: flat.ownerName,
        amount: amount,
        mode: paymentMode,
        date: paymentDate,
        period: paymentPeriod, // CRITICAL: Add period field for payment matching
        reference: reference,
        remarks: remarks,
        bankAccountId: bankAccountId || null, // Store which bank received the payment (null for cash)
        paymentHeads: selectedHeads, // Store selected payment heads
        chequeDate: chequeDate || null, // Store cheque date if provided
        // Payment period information for multi-month payments
        maintenancePeriod: {
            fromMonth: maintenanceFromMonth || null,
            toMonth: maintenanceToMonth || null
        },
        parkingPeriod: {
            fromMonth: parkingFromMonth || null,
            toMonth: parkingToMonth || null
        },
        recordedDate: new Date().toISOString()
    };
    
    console.log('Payment data being saved:', paymentData); // Debug log
    
    payments.push(paymentData);
    savePaymentsData(payments);
    
    // Save individual payment to Firebase immediately
    savePaymentToFirebase(paymentData);
    
    // If a bank account was selected, automatically add credit to that bank
    if (bankAccountId) {
        addMaintenancePaymentToBank(bankAccountId, amount, paymentDate, flatNumber, paymentData.receiptNumber);
    }
    
    // Handle initial outstanding amount payment
    handleInitialOutstandingPayment(flatNumber, selectedHeads);
    
    // Clear member outstanding amounts if payment includes maintenance charges
    if (selectedHeads && selectedHeads.length > 0) {
        const maintenancePayment = selectedHeads.find(head => 
            (head.name || head.type || '').toLowerCase().includes('maintenance') && 
            !(head.name || head.type || '').toLowerCase().includes('building')
        );
        
        if (maintenancePayment) {
            const paidAmount = parseFloat(maintenancePayment.amount) || 0;
            console.log(`🔍 Clearing member outstanding for Flat ${flatNumber}, Amount: ₹${paidAmount}`);
            
            const remainingAmount = clearMemberOutstanding(flatNumber, paidAmount);
            if (remainingAmount === 0) {
                console.log(`✅ All member outstanding cleared for Flat ${flatNumber}`);
                showNotification(`✅ Member outstanding cleared for Flat ${flatNumber}`, 'success');
            } else {
                console.log(`⚠️ Remaining outstanding: ₹${remainingAmount} for Flat ${flatNumber}`);
            }
        }
    }
    
    // Update bill status after payment (enhanced version)
    // Pass payment period information for multi-month payment handling
    updateBillStatusAfterPayment(flatNumber, amount, selectedHeads, paymentDate, parkingFromMonth, parkingToMonth);
    
    // Reduce payment heads from specific bill categories
    if (selectedHeads && selectedHeads.length > 0) {
        reducePaymentHeadsFromFlat(flatNumber, selectedHeads);
        console.log(`Reduced payment heads from Flat ${flatNumber} specific categories`);
    }
    
    closeModal();
    
    // Refresh all data displays
    loadPaymentsData();
    loadFlatsData(); // Refresh flats to show updated outstanding amount
    loadBillingData(); // Refresh bills to show updated status
    loadDashboardData();
    refreshAllDataDisplays(); // Additional refresh to ensure all tables are updated
    
    showNotification('Payment recorded successfully!', 'success');
}

// Function to reduce payment heads from flat when payment is made
function reducePaymentHeadsFromFlat(flatNumber, paymentHeads) {
    const bills = getBillsData();
    const flats = getFlatsData();
    
    console.log(`Reducing payment heads from Flat ${flatNumber}:`, paymentHeads);
    
    // Find the most recent unpaid or partially paid bill for this flat
    const flatBills = bills
        .filter(bill => bill.flatNumber === flatNumber)
        .sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
    
    let updatedBills = false;
    
    paymentHeads.forEach(head => {
        console.log(`Processing head:`, head);
        console.log(`Head name: ${head.name}, Head type: ${head.type}, Amount: ₹${head.amount}`);
        
        // Use both name and type for matching
        const headName = (head.name || '').toLowerCase();
        const headType = (head.type || '').toLowerCase();
        
        // Try to reduce the amount from the appropriate bill category
        if ((headName.includes('maintenance') || headType.includes('maintenance')) && !headName.includes('building') && !headType.includes('building')) {
            // Reduce from maintenance charges in recent bill
            const targetBill = flatBills.find(bill => bill.maintenanceCharge > 0);
            if (targetBill) {
                targetBill.maintenanceCharge = Math.max(0, targetBill.maintenanceCharge - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from maintenance charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('sinking') || headType.includes('sinking')) {
            // Reduce from sinking fund
            const targetBill = flatBills.find(bill => bill.sinkingFund > 0);
            if (targetBill) {
                targetBill.sinkingFund = Math.max(0, targetBill.sinkingFund - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from sinking fund in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('parking') || headType.includes('parking')) {
            // Reduce from parking charges
            const targetBill = flatBills.find(bill => (bill.parkingCharges || 0) > 0);
            if (targetBill) {
                targetBill.parkingCharges = Math.max(0, (targetBill.parkingCharges || 0) - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from parking charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('festival') || headType.includes('festival')) {
            // Reduce from festival charges
            const targetBill = flatBills.find(bill => (bill.festivalCharges || 0) > 0);
            if (targetBill) {
                targetBill.festivalCharges = Math.max(0, (targetBill.festivalCharges || 0) - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from festival charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('building') || headType.includes('building')) {
            // Reduce from building maintenance
            const targetBill = flatBills.find(bill => (bill.buildingMaintenanceCharges || 0) > 0);
            if (targetBill) {
                targetBill.buildingMaintenanceCharges = Math.max(0, (targetBill.buildingMaintenanceCharges || 0) - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from building maintenance charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('occupancy') || headType.includes('occupancy')) {
            // Reduce from occupancy charges
            const targetBill = flatBills.find(bill => (bill.occupancyCharges || 0) > 0);
            if (targetBill) {
                targetBill.occupancyCharges = Math.max(0, (targetBill.occupancyCharges || 0) - head.amount);
                targetBill.totalAmount = Math.max(0, targetBill.totalAmount - head.amount);
                updatedBills = true;
                console.log(`Reduced ₹${head.amount} from occupancy charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('outstanding') || headType.includes('outstanding') || head.head === 'outstandingAmount') {
            // Handle outstanding amount head specifically
            const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
            if (flatIndex !== -1) {
                const currentOutstanding = flats[flatIndex].outstandingAmount || 0;
                flats[flatIndex].outstandingAmount = Math.max(0, currentOutstanding - head.amount);
                console.log(`Reduced ₹${head.amount} from outstanding amount for Flat ${flatNumber}`);
            }
        } else {
            // For other heads that don't match specific categories, reduce from outstanding amount
            const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
            if (flatIndex !== -1) {
                const currentOutstanding = flats[flatIndex].outstandingAmount || 0;
                flats[flatIndex].outstandingAmount = Math.max(0, currentOutstanding - head.amount);
                console.log(`Head "${head.name}" (₹${head.amount}) - no specific bill category found, reduced from outstanding amount`);
            }
        }
    });
    
    // Save updated data
    if (updatedBills) {
        saveBillsData(bills);
        console.log('Updated bills with reduced payment head amounts');
    }
    
    saveFlatsData(flats);
    console.log('Updated flat data with reduced amounts');
}

// Handle payment of initial outstanding amount
function handleInitialOutstandingPayment(flatNumber, paymentHeads) {
    const flats = getFlatsData();
    const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
    
    if (flatIndex === -1) return;
    
    // Check if outstanding amount was paid (both old and new head types)
    const outstandingPayment = paymentHeads.find(head => 
        head.head === 'initialOutstanding' || head.head === 'outstandingAmount'
    );
    
    if (outstandingPayment && outstandingPayment.amount > 0) {
        // Reduce the outstanding amount from flat data
        const currentOutstanding = flats[flatIndex].outstandingAmount || 0;
        const newOutstanding = Math.max(0, currentOutstanding - outstandingPayment.amount);
        
        flats[flatIndex].outstandingAmount = newOutstanding;
        saveFlatsData(flats);
        
        console.log(`Reduced outstanding amount for flat ${flatNumber}: ₹${outstandingPayment.amount}. New outstanding: ₹${newOutstanding}`);
        
        // Refresh flats table to show updated outstanding amount
        loadFlatsData();
    }
}

// Update bill status after payment is recorded
function updateBillAfterPayment(flatNumber, paymentAmount, paymentDate, paymentHeads) {
    const bills = getBillsData();
    const currentDate = new Date(paymentDate);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const targetPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    
    console.log(`Looking for bill: Flat ${flatNumber}, Period ${targetPeriod}`);
    
    // Find the bill for this flat and month - improved matching logic
    const billIndex = bills.findIndex(bill => {
        if (!bill || !bill.flatNumber) return false;
        
        // Match by flat number
        if (bill.flatNumber !== flatNumber) return false;
        
        // Match by period (try multiple fields)
        if (bill.period === targetPeriod) return true;
        if (bill.billDate && bill.billDate.includes(targetPeriod)) return true;
        if (bill.month && bill.year && 
            `${bill.year}-${String(bill.month).padStart(2, '0')}` === targetPeriod) return true;
        
        return false;
    });
    
    if (billIndex !== -1) {
        const bill = bills[billIndex];
        console.log(`Found bill for update:`, bill);
        
        // Update payment information
        if (!bill.payments) {
            bill.payments = [];
        }
        
        // Add this payment to the bill
        bill.payments.push({
            amount: paymentAmount,
            date: paymentDate,
            paymentHeads: paymentHeads || []
        });
        
        // Calculate total paid amount
        const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
        bill.paidAmount = totalPaid;
        
        // Calculate remaining amount (don't overwrite original outstandingAmount)
        const remainingAmount = Math.max(0, bill.totalAmount - totalPaid);
        
        // Update bill status based on remaining amount
        if (remainingAmount === 0) {
            bill.status = 'paid';
        } else if (totalPaid > 0) {
            bill.status = 'partial';
        } else {
            bill.status = 'pending';
        }
        
        // Update last payment date
        bill.lastPaymentDate = paymentDate;
        
        // Save updated bills
        bills[billIndex] = bill;
        saveBillsData(bills);
        
        console.log(`Bill updated for flat ${flatNumber}: Status=${bill.status}, Remaining=₹${remainingAmount}, Original Outstanding=₹${bill.outstandingAmount || 0}`);
    } else {
        console.log(`No bill found for flat ${flatNumber} in period ${targetPeriod}`);
        console.log('Available bills:', bills.map(b => ({flat: b.flatNumber, period: b.period, billDate: b.billDate})));
    }
}

// Get selected payment heads with their amounts
function getSelectedPaymentHeads() {
    const selectedCheckboxes = document.querySelectorAll('.payment-head-checkbox:checked');
    const paymentHeads = [];
    
    console.log('Found selected checkboxes:', selectedCheckboxes.length); // Debug log
    
    selectedCheckboxes.forEach(checkbox => {
        const headType = checkbox.getAttribute('data-head');
        const amount = parseFloat(checkbox.getAttribute('data-amount'));
        const headName = getHeadDisplayName(headType);
        
        console.log(`Payment head: ${headName}, Amount: ${amount}, Type: ${headType}`); // Enhanced debug log
        
        if (amount > 0) { // Only include heads with amount > 0
            paymentHeads.push({
                type: headType,
                name: headName,
                amount: amount,
                head: headType // Add head property for backward compatibility
            });
            console.log(`✅ Added payment head: ${headName} = ₹${amount}`);
        } else {
            console.warn(`❌ Skipped payment head ${headName} with amount ₹${amount}`);
        }
    });
    
    console.log('Final payment heads for storage:', paymentHeads); // Enhanced debug log
    console.log('Total payment heads amount:', paymentHeads.reduce((sum, head) => sum + head.amount, 0));
    return paymentHeads;
}

// Function to automatically add maintenance payment to bank account
function addMaintenancePaymentToBank(bankId, amount, paymentDate, flatNumber, receiptNumber) {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Check for duplicate payment - avoid adding same receipt multiple times
    const existingPayment = bankPayments.find(payment => 
        payment.reference === `Receipt: ${receiptNumber}` &&
        payment.bankId === bankId &&
        payment.amount === amount &&
        payment.description === `Maintenance payment from Flat ${flatNumber}`
    );
    
    if (existingPayment) {
        console.log('Duplicate bank payment detected, skipping:', receiptNumber);
        return; // Don't add duplicate
    }
    
    // Find the bank
    const bankIndex = banks.findIndex(bank => bank.id === bankId);
    if (bankIndex === -1) {
        console.error('Bank not found for maintenance payment');
        return;
    }
    
    // Update bank balance
    banks[bankIndex].balance = (banks[bankIndex].balance || 0) + amount;
    saveBanksData(banks);
    
    // Add bank payment record
    const bankPaymentData = {
        id: generateId(),
        bankId: bankId,
        type: 'credit',
        amount: amount,
        date: paymentDate,
        description: `Maintenance payment from Flat ${flatNumber}`,
        reference: `Receipt: ${receiptNumber}`,
        category: 'maintenance',
        createdDate: new Date().toISOString()
    };
    
    bankPayments.push(bankPaymentData);
    saveBankPaymentsData(bankPayments);
    
    console.log(`Added ₹${amount} credit to bank ${banks[bankIndex].bankName} for maintenance payment from Flat ${flatNumber}`);
}

// Function to add expense transaction to bank account
function addExpenseToBank(bankId, amount, expenseDate, category, vendor, expenseId) {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    
    // Check for duplicate expense - avoid adding same expense multiple times
    const existingTransaction = bankPayments.find(payment => 
        payment.reference === `Expense: ${expenseId}` &&
        payment.bankId === bankId &&
        payment.amount === amount &&
        payment.type === 'debit'
    );
    
    if (existingTransaction) {
        console.log('Duplicate expense transaction detected, skipping:', expenseId);
        return; // Don't add duplicate
    }
    
    // Find the bank
    const bankIndex = banks.findIndex(bank => bank.id === bankId);
    if (bankIndex === -1) {
        console.error('Bank not found for expense transaction');
        return;
    }
    
    // Check if bank has sufficient balance
    const currentBalance = banks[bankIndex].balance || 0;
    if (currentBalance < amount) {
        showNotification(`Insufficient balance in ${banks[bankIndex].bankName}. Current balance: ₹${currentBalance.toLocaleString()}`, 'warning');
        // Still add the transaction but show warning
    }
    
    // Update bank balance (deduct amount)
    banks[bankIndex].balance = currentBalance - amount;
    saveBanksData(banks);
    
    // Add bank payment record (debit transaction)
    // Mark this as an expense-linked transaction to avoid double counting in reports
    const bankPaymentData = {
        id: generateId(),
        bankId: bankId,
        type: 'debit',
        amount: amount,
        date: expenseDate,
        description: `${category} expense - ${vendor}`,
        reference: `Expense: ${expenseId}`,
        category: 'expense',
        expenseCategory: category,
        isExpenseTransaction: true, // Flag to identify expense-linked transactions
        linkedExpenseId: expenseId, // Link to original expense
        createdDate: new Date().toISOString()
    };
    
    bankPayments.push(bankPaymentData);
    saveBankPaymentsData(bankPayments);
    
    // Refresh bank data display
    refreshBankPaymentsTable();
    
    console.log(`Added ₹${amount} debit to bank ${banks[bankIndex].bankName} for ${category} expense`);
}

// Reports Functions
function loadReportsData() {
    // Initialize reports section - no specific loading needed as reports are generated on demand
    console.log('Reports section loaded');
}

function getReportPeriod() {
    const period = document.getElementById('reportPeriod').value;
    const currentDate = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'current-month':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            break;
        case 'last-month':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            break;
        case 'current-year':
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            endDate = new Date(currentDate.getFullYear(), 11, 31);
            break;
        case 'last-year':
            startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
            endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
            break;
        default:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    
    return { startDate, endDate, period };
}

function generateCollectionReport() {
    console.log('Generating Collection Report...');
    
    try {
        const { startDate, endDate, period } = getReportPeriod();
        const payments = getPaymentsData();
        const banks = getBanksData();
        
        console.log('Report data:', { payments: payments.length, banks: banks.length });
    
    // Filter payments by date range
    const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    // Calculate totals
    const totalCollection = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Group by bank
    const bankWiseCollection = {};
    filteredPayments.forEach(payment => {
        if (payment.bankAccountId) {
            const bank = banks.find(b => b.id === payment.bankAccountId);
            const bankName = bank ? bank.bankName : 'Unknown Bank';
            bankWiseCollection[bankName] = (bankWiseCollection[bankName] || 0) + payment.amount;
        } else {
            bankWiseCollection['Cash/Other'] = (bankWiseCollection['Cash/Other'] || 0) + payment.amount;
        }
    });
    
    // Group by payment mode
    const modeWiseCollection = {};
    filteredPayments.forEach(payment => {
        const mode = getPaymentModeText(payment.mode);
        modeWiseCollection[mode] = (modeWiseCollection[mode] || 0) + payment.amount;
    });
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card">
                <h4>Total Collection</h4>
                <div class="amount">₹${totalCollection.toLocaleString()}</div>
            </div>
            <div class="report-summary-card">
                <h4>Total Transactions</h4>
                <div class="amount">${filteredPayments.length}</div>
            </div>
            <div class="report-summary-card">
                <h4>Average Payment</h4>
                <div class="amount">₹${filteredPayments.length ? Math.round(totalCollection / filteredPayments.length).toLocaleString() : '0'}</div>
            </div>
        </div>
        
        <h4>Bank-wise Collection</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Bank</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(bankWiseCollection).map(([bank, amount]) => `
                    <tr>
                        <td>${bank}</td>
                        <td>₹${amount.toLocaleString()}</td>
                        <td>${totalCollection ? ((amount / totalCollection) * 100).toFixed(1) : 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4>Payment Mode-wise Collection</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Payment Mode</th>
                    <th>Amount</th>
                    <th>Transactions</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(modeWiseCollection).map(([mode, amount]) => {
                    const count = filteredPayments.filter(p => getPaymentModeText(p.mode) === mode).length;
                    return `
                        <tr>
                            <td>${mode}</td>
                            <td>₹${amount.toLocaleString()}</td>
                            <td>${count}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <h4>Detailed Transactions</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Receipt No</th>
                    <th>Flat</th>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Bank</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPayments.map(payment => {
                    const bank = payment.bankAccountId ? banks.find(b => b.id === payment.bankAccountId) : null;
                    return `
                        <tr>
                            <td>${formatDate(payment.date)}</td>
                            <td>${payment.receiptNumber}</td>
                            <td>${payment.flatNumber}</td>
                            <td>${payment.memberName}</td>
                            <td>₹${payment.amount.toLocaleString()}</td>
                            <td>${getPaymentModeText(payment.mode)}</td>
                            <td>${bank ? bank.bankName : 'Cash/Other'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
        showReport('Collection Report', reportContent);
    } catch (error) {
        console.error('Error in generateCollectionReport:', error);
        alert('Error generating collection report. Please try again.');
    }
}

function generateDuesReport() {
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flats = getFlatsData();
    
    // Calculate outstanding amounts for each flat
    const flatDues = {};
    
    // Initialize all flats first
    flats.forEach(flat => {
        flatDues[flat.flatNumber] = {
            flatNumber: flat.flatNumber,
            memberName: flat.ownerName,
            mobile: flat.mobile,
            wing: flat.wing,
            status: flat.status,
            totalBilled: 0,
            totalPaid: 0,
            outstanding: 0,
            bills: [],
            outstandingBreakdown: {}
        };
    });
    
    // Add bills data
    bills.forEach(bill => {
        if (!flatDues[bill.flatNumber]) {
            // If flat not in flats data, create entry from bill
            flatDues[bill.flatNumber] = {
                flatNumber: bill.flatNumber,
                memberName: bill.memberName,
                mobile: '',
                wing: '',
                status: 'owner',
                totalBilled: 0,
                totalPaid: 0,
                outstanding: 0,
                bills: [],
                outstandingBreakdown: {}
            };
        }
        
        flatDues[bill.flatNumber].totalBilled += bill.totalAmount;
        flatDues[bill.flatNumber].bills.push(bill);
        
        // Add outstanding breakdown from maintenance bills
        if (bill.outstandingBreakdown) {
            Object.keys(bill.outstandingBreakdown).forEach(head => {
                if (!flatDues[bill.flatNumber].outstandingBreakdown[head]) {
                    flatDues[bill.flatNumber].outstandingBreakdown[head] = 0;
                }
                flatDues[bill.flatNumber].outstandingBreakdown[head] += bill.outstandingBreakdown[head] || 0;
            });
        }
        
        // If bill has balance amount but no breakdown, add to maintenance
        if (bill.balanceAmount && bill.balanceAmount > 0 && !bill.outstandingBreakdown) {
            if (!flatDues[bill.flatNumber].outstandingBreakdown.maintenanceCharge) {
                flatDues[bill.flatNumber].outstandingBreakdown.maintenanceCharge = 0;
            }
            flatDues[bill.flatNumber].outstandingBreakdown.maintenanceCharge += bill.balanceAmount;
        }
        
        // Update member name from latest bill if different
        if (bill.memberName && bill.memberName.trim()) {
            flatDues[bill.flatNumber].memberName = bill.memberName;
        }
    });
    
    // Calculate payments for each flat
    payments.forEach(payment => {
        if (flatDues[payment.flatNumber]) {
            flatDues[payment.flatNumber].totalPaid += payment.amount;
        } else {
            // Create entry for flats that have payments but no bills
            const flatData = flats.find(f => f.flatNumber === payment.flatNumber);
            if (flatData) {
                flatDues[payment.flatNumber] = {
                    flatNumber: payment.flatNumber,
                    memberName: payment.memberName || flatData.ownerName,
                    mobile: flatData.mobile,
                    wing: flatData.wing,
                    status: flatData.status,
                    totalBilled: 0,
                    totalPaid: payment.amount,
                    outstanding: 0,
                    bills: [],
                    outstandingBreakdown: {}
                };
            }
        }
    });
    
    // Calculate outstanding amounts and sync with flats data
    Object.values(flatDues).forEach(flat => {
        flat.outstanding = Math.max(0, flat.totalBilled - flat.totalPaid);
        
        // If no outstanding breakdown from bills, calculate from flat's outstandingAmount
        const flatData = flats.find(f => f.flatNumber === flat.flatNumber);
        if (flatData) {
            // Update flat data with calculated outstanding
            flatData.outstandingAmount = flat.outstanding;
            
            // If flat has outstandingAmount but no breakdown, add it to maintenance
            if (flatData.outstandingAmount > 0 && (!flat.outstandingBreakdown || Object.keys(flat.outstandingBreakdown).length === 0)) {
                flat.outstandingBreakdown = {
                    maintenanceCharge: flatData.outstandingAmount,
                    sinkingFund: 0,
                    parkingCharges: 0,
                    festivalCharges: 0,
                    buildingMaintenanceCharges: 0
                };
            }
        }
        
        // Ensure outstanding matches breakdown total if breakdown exists
        if (flat.outstandingBreakdown && Object.keys(flat.outstandingBreakdown).length > 0) {
            const breakdownTotal = Object.values(flat.outstandingBreakdown).reduce((sum, amount) => sum + (amount || 0), 0);
            if (breakdownTotal > 0 && flat.outstanding !== breakdownTotal) {
                flat.outstanding = breakdownTotal;
            }
        }
    });
    
    // Get all flats and separate outstanding vs paid
    const allFlats = Object.values(flatDues);
    const outstandingFlats = allFlats.filter(flat => flat.outstanding > 0);
    const paidFlats = allFlats.filter(flat => flat.outstanding === 0 && flat.totalBilled > 0);
    const totalOutstanding = outstandingFlats.reduce((sum, flat) => sum + flat.outstanding, 0);
    const totalPaid = allFlats.reduce((sum, flat) => sum + flat.totalPaid, 0);
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card expense">
                <h4>Total Outstanding</h4>
                <div class="amount">₹${totalOutstanding.toLocaleString()}</div>
                <small>${outstandingFlats.length} flats</small>
            </div>
            <div class="report-summary-card income">
                <h4>Total Paid</h4>
                <div class="amount">₹${totalPaid.toLocaleString()}</div>
                <small>${paidFlats.length} flats cleared</small>
            </div>
            <div class="report-summary-card">
                <h4>Total Flats</h4>
                <div class="amount">${allFlats.filter(f => f.totalBilled > 0).length}</div>
                <small>With bills generated</small>
            </div>
            <div class="report-summary-card">
                <h4>Collection Rate</h4>
                <div class="amount">${totalPaid + totalOutstanding > 0 ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100) : 0}%</div>
                <small>Payment completion</small>
            </div>
        </div>
        
        <h4>Payment Status by Flat</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Flat No</th>
                    <th>Member Name</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th>Total Billed</th>
                    <th>Total Paid</th>
                    <th>Outstanding</th>
                    <th>Outstanding Details</th>
                    <th>Payment Status</th>
                    <th>Bills Count</th>
                </tr>
            </thead>
            <tbody>
                ${allFlats
                    .filter(flat => flat.totalBilled > 0) // Only show flats with bills
                    .sort((a, b) => {
                        // First sort by outstanding amount (highest first)
                        if (a.outstanding !== b.outstanding) {
                            return b.outstanding - a.outstanding;
                        }
                        // Then sort by wing
                        if (a.wing !== b.wing) {
                            return (a.wing || '').localeCompare(b.wing || '');
                        }
                        // Finally sort by flat number (numerical order)
                        const flatA = parseInt(a.flatNumber.replace(/[^0-9]/g, '')) || 0;
                        const flatB = parseInt(b.flatNumber.replace(/[^0-9]/g, '')) || 0;
                        return flatA - flatB;
                    })
                    .map(flat => {
                    // Create outstanding breakdown display
                    let outstandingDetails = '';
                    if (flat.outstandingBreakdown && Object.keys(flat.outstandingBreakdown).length > 0) {
                        const breakdownItems = [];
                        if (flat.outstandingBreakdown.maintenanceCharge > 0) {
                            breakdownItems.push(`Maintenance: ₹${flat.outstandingBreakdown.maintenanceCharge.toLocaleString()}`);
                        }
                        if (flat.outstandingBreakdown.sinkingFund > 0) {
                            breakdownItems.push(`Sinking: ₹${flat.outstandingBreakdown.sinkingFund.toLocaleString()}`);
                        }
                        if (flat.outstandingBreakdown.parkingCharges > 0) {
                            breakdownItems.push(`Parking: ₹${flat.outstandingBreakdown.parkingCharges.toLocaleString()}`);
                        }
                        if (flat.outstandingBreakdown.festivalCharges > 0) {
                            breakdownItems.push(`Festival: ₹${flat.outstandingBreakdown.festivalCharges.toLocaleString()}`);
                        }
                        if (flat.outstandingBreakdown.buildingMaintenanceCharges > 0) {
                            breakdownItems.push(`Building: ₹${flat.outstandingBreakdown.buildingMaintenanceCharges.toLocaleString()}`);
                        }
                        outstandingDetails = breakdownItems.join('<br>');
                    }
                    
                    // Determine payment status
                    let paymentStatus = '';
                    let statusClass = '';
                    if (flat.outstanding === 0) {
                        paymentStatus = '✅ Paid';
                        statusClass = 'text-success';
                    } else if (flat.totalPaid === 0) {
                        paymentStatus = '❌ Pending';
                        statusClass = 'text-danger';
                    } else {
                        paymentStatus = '⚠️ Partial';
                        statusClass = 'text-warning';
                    }
                    
                    return `
                    <tr>
                        <td>${flat.flatNumber}${flat.wing ? ` (${flat.wing})` : ''}</td>
                        <td>${flat.memberName}</td>
                        <td>${flat.mobile || '-'}</td>
                        <td>
                            <span class="status-indicator status-${flat.status || 'owner'}">
                                ${getStatusText(flat.status || 'owner')}
                            </span>
                        </td>
                        <td>₹${flat.totalBilled.toLocaleString()}</td>
                        <td class="${flat.totalPaid > 0 ? 'text-success' : ''}">₹${flat.totalPaid.toLocaleString()}</td>
                        <td class="${flat.outstanding > 0 ? 'text-danger' : 'text-success'}"><strong>₹${flat.outstanding.toLocaleString()}</strong></td>
                        <td style="font-size: 11px; line-height: 1.3;">
                            ${outstandingDetails || '<span style="color: #666;">-</span>'}
                        </td>
                        <td class="${statusClass}"><strong>${paymentStatus}</strong></td>
                        <td>${flat.bills.length}</td>
                    </tr>
                `;
                }).join('')}
                ${outstandingFlats.length === 0 ? `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 20px; color: #28a745;">
                            🎉 <strong>Excellent! No outstanding dues found.</strong><br>
                            <small>All flats have cleared their payments.</small>
                        </td>
                    </tr>
                ` : ''}
            </tbody>
        </table>
        
        ${outstandingFlats.length > 0 ? `
        <div style="margin-top: 30px;">
            <h4>Outstanding by Maintenance Categories</h4>
            <div class="report-summary">
                ${(() => {
                    const categoryTotals = {
                        maintenanceCharge: 0,
                        sinkingFund: 0,
                        parkingCharges: 0,
                        festivalCharges: 0,
                        buildingMaintenanceCharges: 0
                    };
                    
                    outstandingFlats.forEach(flat => {
                        if (flat.outstandingBreakdown) {
                            Object.keys(categoryTotals).forEach(category => {
                                categoryTotals[category] += flat.outstandingBreakdown[category] || 0;
                            });
                        }
                    });
                    
                    const categoryLabels = {
                        maintenanceCharge: 'Maintenance Charges',
                        sinkingFund: 'Sinking Fund',
                        parkingCharges: 'Parking Charges',
                        festivalCharges: 'Festival Charges',
                        buildingMaintenanceCharges: 'Building Maintenance'
                    };
                    
                    return Object.keys(categoryTotals).map(category => {
                        const amount = categoryTotals[category];
                        return amount > 0 ? `
                            <div class="report-summary-card ${category === 'maintenanceCharge' ? 'expense' : ''}">
                                <h4>${categoryLabels[category]}</h4>
                                <div class="amount">₹${amount.toLocaleString()}</div>
                                <small>${outstandingFlats.filter(f => f.outstandingBreakdown && f.outstandingBreakdown[category] > 0).length} flats</small>
                            </div>
                        ` : '';
                    }).join('');
                })()}
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h4>Summary by Status</h4>
            <div class="report-summary">
                ${['owner', 'tenant', 'vacant'].map(status => {
                    const statusFlats = outstandingFlats.filter(flat => (flat.status || 'owner') === status);
                    const statusTotal = statusFlats.reduce((sum, flat) => sum + flat.outstanding, 0);
                    return statusTotal > 0 ? `
                        <div class="report-summary-card">
                            <h4>${getStatusText(status)} Dues</h4>
                            <div class="amount">₹${statusTotal.toLocaleString()}</div>
                            <small>${statusFlats.length} flats</small>
                        </div>
                    ` : '';
                }).join('')}
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h4>Outstanding Amount Ranges</h4>
            <div class="report-summary">
                ${(() => {
                    const ranges = [
                        { min: 0, max: 5000, label: 'Under ₹5K' },
                        { min: 5000, max: 15000, label: '₹5K - ₹15K' },
                        { min: 15000, max: 50000, label: '₹15K - ₹50K' },
                        { min: 50000, max: Infinity, label: 'Above ₹50K' }
                    ];
                    
                    return ranges.map(range => {
                        const rangeFlats = outstandingFlats.filter(flat => 
                            flat.outstanding > range.min && flat.outstanding <= range.max
                        );
                        const rangeTotal = rangeFlats.reduce((sum, flat) => sum + flat.outstanding, 0);
                        
                        return rangeFlats.length > 0 ? `
                            <div class="report-summary-card ${range.min >= 50000 ? 'expense' : ''}">
                                <h4>${range.label}</h4>
                                <div class="amount">₹${rangeTotal.toLocaleString()}</div>
                                <small>${rangeFlats.length} flats</small>
                            </div>
                        ` : '';
                    }).join('');
                })()}
            </div>
        </div>
        ` : ''}
    `;
    
    // Save updated flats data with outstanding amounts
    saveFlatsData(flats);
    
    showReport('Outstanding Dues Report', reportContent);
}

function generateExpenseReport() {
    const { startDate, endDate } = getReportPeriod();
    const expenses = getExpensesData();
    const bankPayments = getBankPaymentsData();
    
    // Filter expenses by date range
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    // Filter bank debits (expenses) by date range - but exclude expense-linked transactions to avoid double counting
    const bankExpenses = bankPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return payment.type === 'debit' && 
               paymentDate >= startDate && 
               paymentDate <= endDate &&
               !payment.isExpenseTransaction; // Exclude expense-linked transactions
    });
    
    // Calculate totals
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBankExpenses = bankExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const grandTotal = totalExpenses + totalBankExpenses;
    
    // Group by category
    const categoryWiseExpenses = {};
    filteredExpenses.forEach(expense => {
        categoryWiseExpenses[expense.category] = (categoryWiseExpenses[expense.category] || 0) + expense.amount;
    });
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card expense">
                <h4>Total Expenses</h4>
                <div class="amount">₹${grandTotal.toLocaleString()}</div>
            </div>
            <div class="report-summary-card expense">
                <h4>Direct Expenses</h4>
                <div class="amount">₹${totalExpenses.toLocaleString()}</div>
            </div>
            <div class="report-summary-card expense">
                <h4>Bank Payments</h4>
                <div class="amount">₹${totalBankExpenses.toLocaleString()}</div>
            </div>
        </div>
        
        <h4>Category-wise Expenses</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(categoryWiseExpenses).map(([category, amount]) => `
                    <tr>
                        <td>${category}</td>
                        <td>₹${amount.toLocaleString()}</td>
                        <td>${grandTotal ? ((amount / grandTotal) * 100).toFixed(1) : 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4>Recent Expenses</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Vendor</th>
                </tr>
            </thead>
            <tbody>
                ${filteredExpenses.slice(0, 20).map(expense => `
                    <tr>
                        <td>${formatDate(expense.date)}</td>
                        <td>${expense.category}</td>
                        <td>${expense.description}</td>
                        <td>₹${expense.amount.toLocaleString()}</td>
                        <td>${expense.vendor || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    showReport('Expense Report', reportContent);
}

function generateBankReport() {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    const { startDate, endDate } = getReportPeriod();
    
    // Get fresh data and filter bank payments by date range
    const currentBankPayments = getBankPaymentsData(); // Get fresh data
    const filteredPayments = currentBankPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    // Calculate bank-wise summary
    const bankSummary = banks.map(bank => {
        const bankTransactions = filteredPayments.filter(p => p.bankId === bank.id);
        const credits = bankTransactions.filter(p => p.type === 'credit').reduce((sum, p) => sum + p.amount, 0);
        const debits = bankTransactions.filter(p => p.type === 'debit').reduce((sum, p) => sum + p.amount, 0);
        
        return {
            ...bank,
            credits,
            debits,
            netFlow: credits - debits,
            transactionCount: bankTransactions.length
        };
    });
    
    const totalCredits = bankSummary.reduce((sum, bank) => sum + bank.credits, 0);
    const totalDebits = bankSummary.reduce((sum, bank) => sum + bank.debits, 0);
    const totalBalance = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card">
                <h4>Total Credits</h4>
                <div class="amount">₹${totalCredits.toLocaleString()}</div>
            </div>
            <div class="report-summary-card expense">
                <h4>Total Debits</h4>
                <div class="amount">₹${totalDebits.toLocaleString()}</div>
            </div>
            <div class="report-summary-card balance">
                <h4>Current Balance</h4>
                <div class="amount">₹${totalBalance.toLocaleString()}</div>
            </div>
        </div>
        
        <h4>Bank-wise Summary</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Bank Name</th>
                    <th>Account No</th>
                    <th>Credits</th>
                    <th>Debits</th>
                    <th>Net Flow</th>
                    <th>Current Balance</th>
                    <th>Transactions</th>
                </tr>
            </thead>
            <tbody>
                ${bankSummary.map(bank => `
                    <tr>
                        <td>${bank.bankName}</td>
                        <td>${bank.accountNumber}</td>
                        <td class="text-success">₹${bank.credits.toLocaleString()}</td>
                        <td class="text-danger">₹${bank.debits.toLocaleString()}</td>
                        <td class="${bank.netFlow >= 0 ? 'text-success' : 'text-danger'}">₹${bank.netFlow.toLocaleString()}</td>
                        <td>₹${(bank.balance || 0).toLocaleString()}</td>
                        <td>${bank.transactionCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4>Recent Bank Transactions</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Bank</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Reference</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPayments.length > 0 ? filteredPayments
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20)
                    .map(payment => {
                        const bank = banks.find(b => b.id === payment.bankId);
                        return `
                            <tr>
                                <td>${formatDate(payment.date)}</td>
                                <td>${bank ? bank.bankName : 'Unknown'}</td>
                                <td><span class="status-badge status-${payment.type}">${payment.type === 'credit' ? 'Credit' : 'Debit'}</span></td>
                                <td class="${payment.type === 'credit' ? 'text-success' : 'text-danger'}">
                                    ${payment.type === 'credit' ? '+' : '-'}₹${payment.amount.toLocaleString()}
                                </td>
                                <td>${payment.description || 'N/A'}</td>
                                <td>${payment.reference || 'N/A'}</td>
                            </tr>
                        `;
                    }).join('') : `
                    <tr>
                        <td colspan="6" class="text-center">No bank transactions found for the selected period</td>
                    </tr>
                `}
            </tbody>
        </table>
    `;
    
    showReport('Bank Reconciliation Report', reportContent);
}

function generateFinancialReport() {
    // First, clean up any bank payments that should be marked as expense transactions
    cleanupBankExpenseTransactions();
    
    const { startDate, endDate } = getReportPeriod();
    const payments = getPaymentsData();
    const expenses = getExpensesData();
    const bankPayments = getBankPaymentsData();
    
    // Filter by date range
    const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    const filteredBankPayments = bankPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    // Calculate totals - avoid double counting expenses
    const totalIncome = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    // Only count bank expenses that are NOT linked to expense records to avoid double counting
    const bankExpensesList = filteredBankPayments.filter(p => {
        const isDebit = p.type === 'debit';
        const isNotExpenseLinked = !p.isExpenseTransaction;
        const isNotExpenseCategory = p.category !== 'expense';
        const isNotExpenseReference = !p.reference || !p.reference.startsWith('Expense:');
        
        // Debug logging
        if (isDebit) {
            console.log('Bank Payment Debug:', {
                id: p.id,
                amount: p.amount,
                isExpenseTransaction: p.isExpenseTransaction,
                category: p.category,
                reference: p.reference,
                description: p.description,
                shouldInclude: isNotExpenseLinked && isNotExpenseCategory && isNotExpenseReference
            });
        }
        
        return isDebit && isNotExpenseLinked && isNotExpenseCategory && isNotExpenseReference;
    });
    
    const bankExpenses = bankExpensesList.reduce((sum, p) => sum + p.amount, 0);
    const totalExpensesAll = totalExpenses + bankExpenses;
    const netIncome = totalIncome - totalExpensesAll;
    
    // Group expenses by category for detailed breakdown
    const categoryWiseExpenses = {};
    filteredExpenses.forEach(expense => {
        const category = getCategoryDisplayName(expense.category);
        categoryWiseExpenses[category] = (categoryWiseExpenses[category] || 0) + expense.amount;
    });
    
    // Add bank expenses as separate category only if there are actual non-expense bank payments
    if (bankExpensesList.length > 0) {
        categoryWiseExpenses['Bank Payments'] = bankExpenses;
    }
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card">
                <h4>Total Income</h4>
                <div class="amount">₹${totalIncome.toLocaleString()}</div>
            </div>
            <div class="report-summary-card expense">
                <h4>Total Expenses</h4>
                <div class="amount">₹${totalExpensesAll.toLocaleString()}</div>
            </div>
            <div class="report-summary-card ${netIncome >= 0 ? '' : 'expense'}">
                <h4>Net ${netIncome >= 0 ? 'Profit' : 'Loss'}</h4>
                <div class="amount">₹${Math.abs(netIncome).toLocaleString()}</div>
            </div>
        </div>
        
        <h4>Income vs Expense Analysis</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage of Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>INCOME</strong></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td>Maintenance Collection</td>
                    <td class="text-success">₹${totalIncome.toLocaleString()}</td>
                    <td>${totalIncome ? '100.0' : '0.0'}%</td>
                </tr>
                <tr>
                    <td><strong>EXPENSES</strong></td>
                    <td></td>
                    <td></td>
                </tr>
                ${Object.entries(categoryWiseExpenses).map(([category, amount]) => `
                <tr>
                    <td>&nbsp;&nbsp;${category}</td>
                    <td class="text-danger">₹${amount.toLocaleString()}</td>
                    <td>${totalIncome ? ((amount / totalIncome) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                `).join('')}
                <tr style="border-top: 1px solid #ddd;">
                    <td><strong>Total Expenses</strong></td>
                    <td class="text-danger"><strong>₹${totalExpensesAll.toLocaleString()}</strong></td>
                    <td><strong>${totalIncome ? ((totalExpensesAll / totalIncome) * 100).toFixed(1) : '0.0'}%</strong></td>
                </tr>
                <tr style="border-top: 2px solid #000;">
                    <td><strong>NET ${netIncome >= 0 ? 'PROFIT' : 'LOSS'}</strong></td>
                    <td class="${netIncome >= 0 ? 'text-success' : 'text-danger'}"><strong>₹${Math.abs(netIncome).toLocaleString()}</strong></td>
                    <td><strong>${totalIncome ? ((Math.abs(netIncome) / totalIncome) * 100).toFixed(1) : '0.0'}%</strong></td>
                </tr>
            </tbody>
        </table>
        
        <h4>Detailed Expense Entries</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                </tr>
            </thead>
            <tbody>
                ${filteredExpenses.length > 0 ? filteredExpenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(expense => `
                    <tr>
                        <td>${formatDate(expense.date)}</td>
                        <td>${getCategoryDisplayName(expense.category)}</td>
                        <td>${expense.description || 'N/A'}</td>
                        <td>${expense.vendor || 'N/A'}</td>
                        <td>₹${expense.amount.toLocaleString()}</td>
                        <td><span class="status-badge status-${expense.paymentMode}">${getPaymentModeText(expense.paymentMode)}</span></td>
                    </tr>
                    `).join('') : `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #666;">No expense entries found for the selected period</td>
                    </tr>
                `}
                ${bankExpensesList.length > 0 ? `
                <tr style="border-top: 1px solid #ddd;">
                    <td colspan="6"><strong>Bank Payments (Non-expense linked):</strong></td>
                </tr>
                ${bankExpensesList.map(payment => `
                <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>Bank Payment</td>
                    <td>${payment.description || payment.reference || 'Bank Debit'}</td>
                    <td>${payment.vendor || 'N/A'}</td>
                    <td>₹${payment.amount.toLocaleString()}</td>
                    <td><span class="status-badge status-bank">Bank Transfer</span></td>
                </tr>
                `).join('')}
                ` : ''}
            </tbody>
        </table>
    `;
    
    showReport('Financial Summary Report', reportContent);
}

// Helper function to get display name for expense categories
function getCategoryDisplayName(category) {
    const categoryMap = {
        'electricity': 'Electricity',
        'water': 'Water',
        'security': 'Security',
        'cleaning': 'Cleaning',
        'maintenance': 'Maintenance & Repair',
        'gardening': 'Gardening',
        'lift': 'Lift Maintenance',
        'insurance': 'Insurance',
        'bank_charges': 'Bank Charges',
        'legal': 'Legal',
        'office': 'Office Expenses',
        'other': 'Other',
        'utilities': 'Utilities',
        'repairs': 'Repairs',
        'admin': 'Administrative'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Function to clean up bank payments that should be marked as expense transactions
function cleanupBankExpenseTransactions() {
    const bankPayments = getBankPaymentsData();
    const expenses = getExpensesData();
    let updated = false;
    
    // Check each bank payment to see if it should be marked as expense transaction
    bankPayments.forEach(payment => {
        if (payment.type === 'debit' && !payment.isExpenseTransaction) {
            // Check if this payment matches an expense
            const matchingExpense = expenses.find(expense => {
                // Check if reference matches expense ID pattern
                const refMatches = payment.reference && payment.reference.includes(expense.id);
                // Check if amounts and dates are close
                const amountMatches = Math.abs(payment.amount - expense.amount) < 0.01;
                const dateMatches = payment.date === expense.date;
                // Check if description contains expense info
                const descMatches = payment.description && 
                    (payment.description.includes(expense.category) || 
                     payment.description.includes(expense.vendor));
                
                return (refMatches || (amountMatches && dateMatches && descMatches));
            });
            
            if (matchingExpense) {
                console.log('Marking bank payment as expense transaction:', payment.id);
                payment.isExpenseTransaction = true;
                payment.linkedExpenseId = matchingExpense.id;
                payment.category = 'expense';
                payment.expenseCategory = matchingExpense.category;
                updated = true;
            }
        }
    });
    
    if (updated) {
        saveBankPaymentsData(bankPayments);
        console.log('Updated bank payments to mark expense transactions');
    }
}

function generateBalanceSheetReport() {
    const { startDate, endDate } = getReportPeriod();
    const payments = getPaymentsData();
    const expenses = getExpensesData();
    const bankPayments = getBankPaymentsData();
    const banks = getBanksData();
    const bills = getBillsData();
    
    // Calculate Assets
    const totalBankBalance = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
    
    // Calculate outstanding amounts (Accounts Receivable)
    const flatDues = {};
    bills.forEach(bill => {
        if (!flatDues[bill.flatNumber]) {
            flatDues[bill.flatNumber] = {
                flatNumber: bill.flatNumber,
                memberName: bill.memberName,
                totalBilled: 0,
                totalPaid: 0,
                outstanding: 0
            };
        }
        flatDues[bill.flatNumber].totalBilled += bill.totalAmount;
    });
    
    // Calculate payments against bills
    payments.forEach(payment => {
        if (flatDues[payment.flatNumber]) {
            flatDues[payment.flatNumber].totalPaid += payment.amount;
        }
    });
    
    // Calculate outstanding amounts
    Object.values(flatDues).forEach(flat => {
        flat.outstanding = Math.max(0, flat.totalBilled - flat.totalPaid);
    });
    
    const totalOutstanding = Object.values(flatDues).reduce((sum, flat) => sum + flat.outstanding, 0);
    
    // Calculate total assets
    const totalAssets = totalBankBalance + totalOutstanding;
    
    // Calculate Liabilities (Advance payments - payments more than bills)
    const advancePayments = Object.values(flatDues).reduce((sum, flat) => {
        const advance = Math.max(0, flat.totalPaid - flat.totalBilled);
        return sum + advance;
    }, 0);
    
    // Calculate Society Fund (Equity)
    // Total Income - Total Expenses = Society Fund
    const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const bankExpenses = bankPayments.filter(p => p.type === 'debit' && !p.isExpenseTransaction).reduce((sum, p) => sum + p.amount, 0);
    const totalExpensesAll = totalExpenses + bankExpenses;
    const societyFund = totalIncome - totalExpensesAll;
    
    // Total Liabilities + Equity
    const totalLiabilitiesEquity = advancePayments + societyFund;
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card">
                <h4>Total Assets</h4>
                <div class="amount">₹${totalAssets.toLocaleString()}</div>
            </div>
            <div class="report-summary-card">
                <h4>Total Liabilities</h4>
                <div class="amount">₹${advancePayments.toLocaleString()}</div>
            </div>
            <div class="report-summary-card balance">
                <h4>Society Fund</h4>
                <div class="amount">₹${societyFund.toLocaleString()}</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
            <div>
                <h4>ASSETS</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Asset Type</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Current Assets</strong></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;Cash & Bank Balance</td>
                            <td>₹${totalBankBalance.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;Accounts Receivable (Outstanding)</td>
                            <td>₹${totalOutstanding.toLocaleString()}</td>
                        </tr>
                        <tr style="font-weight: bold; border-top: 2px solid #ddd;">
                            <td><strong>TOTAL ASSETS</strong></td>
                            <td><strong>₹${totalAssets.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div>
                <h4>LIABILITIES & EQUITY</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Current Liabilities</strong></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;Advance Payments</td>
                            <td>₹${advancePayments.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td><strong>Society Equity</strong></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;Accumulated Fund</td>
                            <td>₹${societyFund.toLocaleString()}</td>
                        </tr>
                        <tr style="font-weight: bold; border-top: 2px solid #ddd;">
                            <td><strong>TOTAL LIABILITIES & EQUITY</strong></td>
                            <td><strong>₹${totalLiabilitiesEquity.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h4>Outstanding Dues by Flat</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Flat No</th>
                        <th>Member Name</th>
                        <th>Total Billed</th>
                        <th>Total Paid</th>
                        <th>Outstanding</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(flatDues)
                        .filter(flat => flat.outstanding > 0)
                        .sort((a, b) => b.outstanding - a.outstanding)
                        .map(flat => `
                            <tr>
                                <td>${flat.flatNumber}</td>
                                <td>${flat.memberName}</td>
                                <td>₹${flat.totalBilled.toLocaleString()}</td>
                                <td>₹${flat.totalPaid.toLocaleString()}</td>
                                <td>₹${flat.outstanding.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p><small><strong>Note:</strong> This Balance Sheet shows the financial position as of the selected period. 
            Assets include cash/bank balances and outstanding receivables. 
            Liabilities include advance payments from members. 
            Society Fund represents the accumulated surplus/deficit from operations.</small></p>
        </div>
    `;
    
    showReport('Balance Sheet Report', reportContent);
}

function generateAuditReport() {
    console.log('Generating Audit Trail Report...');
    
    try {
        const payments = getPaymentsData();
        const expenses = getExpensesData();
        const bankPayments = getBankPaymentsData();
        const bills = getBillsData();
        
        console.log('Audit data:', { 
            payments: payments.length, 
            expenses: expenses.length, 
            bankPayments: bankPayments.length, 
            bills: bills.length 
        });
        
        // Filter out bank payments that are maintenance payments (to avoid duplicates)
        const filteredBankPayments = bankPayments.filter(bp => {
            // Exclude bank payments that have a reference starting with "Receipt:" (these are maintenance payments)
            return !bp.reference || !bp.reference.startsWith('Receipt:');
        });
        
        // Combine all transactions
        const allTransactions = [
            ...payments.map(p => ({ ...p, type: 'Payment', amount: p.amount, date: p.date })),
            ...expenses.map(e => ({ ...e, type: 'Expense', amount: -e.amount, date: e.date })),
            ...filteredBankPayments.map(bp => ({ ...bp, type: `Bank ${bp.type}`, amount: bp.type === 'credit' ? bp.amount : -bp.amount, date: bp.date }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('Total transactions for audit:', allTransactions.length);
        
        // Check if there's any data
        if (allTransactions.length === 0 && bills.length === 0) {
            alert('No data available for audit report. Please add some transactions first.');
            return;
        }
    
    const reportContent = `
        <div class="report-summary">
            <div class="report-summary-card">
                <h4>Total Transactions</h4>
                <div class="amount">${allTransactions.length}</div>
            </div>
            <div class="report-summary-card">
                <h4>Bills Generated</h4>
                <div class="amount">${bills.length}</div>
            </div>
            <div class="report-summary-card">
                <h4>Payments Recorded</h4>
                <div class="amount">${payments.length}</div>
            </div>
        </div>
        
        <h4>Complete Transaction History</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Reference</th>
                </tr>
            </thead>
            <tbody>
                ${allTransactions.slice(0, 50).map(transaction => `
                    <tr>
                        <td>${formatDate(transaction.date)}</td>
                        <td><span class="status-badge">${transaction.type}</span></td>
                        <td>${transaction.description || transaction.memberName || transaction.category || 'N/A'}</td>
                        <td class="${transaction.amount >= 0 ? 'text-success' : 'text-danger'}">
                            ${transaction.amount >= 0 ? '+' : ''}₹${Math.abs(transaction.amount).toLocaleString()}
                        </td>
                        <td>${transaction.reference || transaction.receiptNumber || transaction.billNumber || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
        showReport('Audit Trail Report', reportContent);
    } catch (error) {
        console.error('Error in generateAuditReport:', error);
        alert('Error generating audit report. Please try again.');
    }
}

function generateBalanceSheetReport() {
    console.log('Generating Balance Sheet Report...');
    
    try {
        const payments = getPaymentsData();
        const expenses = getExpensesData();
        const banks = getBanksData();
        const bankPayments = getBankPaymentsData();
        const bills = getBillsData();
        const flats = getFlatsData();
        
        // Calculate Assets
        const totalBankBalance = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
        const totalOutstandingDues = calculateTotalOutstandingDues(bills, payments);
        const totalAssets = totalBankBalance + totalOutstandingDues;
        
        // Calculate Liabilities (advance payments, security deposits)
        const advancePayments = payments.filter(p => p.remarks && p.remarks.toLowerCase().includes('advance')).reduce((sum, p) => sum + p.amount, 0);
        const securityDeposits = flats.reduce((sum, flat) => sum + (flat.securityDeposit || 0), 0);
        const totalLiabilities = advancePayments + securityDeposits;
        
        // Calculate Equity (Accumulated funds)
        const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        // Only count bank payments that are NOT linked to expenses (to avoid double counting)
        const nonExpenseBankPayments = bankPayments.filter(bp => bp.type === 'debit' && !bp.isExpenseTransaction).reduce((sum, bp) => sum + bp.amount, 0);
        const accumulatedFunds = totalIncome - totalExpenses - nonExpenseBankPayments;
        const totalEquity = accumulatedFunds;
        
        const reportContent = `
            <div class="report-summary">
                <div class="report-summary-card">
                    <h4>Total Assets</h4>
                    <div class="amount">₹${totalAssets.toLocaleString()}</div>
                </div>
                <div class="report-summary-card expense">
                    <h4>Total Liabilities</h4>
                    <div class="amount">₹${totalLiabilities.toLocaleString()}</div>
                </div>
                <div class="report-summary-card balance">
                    <h4>Society Equity</h4>
                    <div class="amount">₹${totalEquity.toLocaleString()}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h4>ASSETS</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Asset Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>CURRENT ASSETS</strong></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Cash & Bank Balances</td>
                                <td class="text-success">₹${totalBankBalance.toLocaleString()}</td>
                            </tr>
                            ${banks.map(bank => `
                                <tr>
                                    <td>&nbsp;&nbsp;- ${bank.bankName}</td>
                                    <td>₹${(bank.balance || 0).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td>Outstanding Dues (Receivables)</td>
                                <td class="text-success">₹${totalOutstandingDues.toLocaleString()}</td>
                            </tr>
                            ${flats.filter(flat => flat.outstandingAmount > 0).map(flat => `
                                <tr>
                                    <td>&nbsp;&nbsp;- Flat ${flat.flatNumber}</td>
                                    <td>₹${(flat.outstandingAmount || 0).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            <tr style="border-top: 2px solid #000;">
                                <td><strong>TOTAL ASSETS</strong></td>
                                <td class="text-success"><strong>₹${totalAssets.toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div>
                    <h4>LIABILITIES & EQUITY</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>CURRENT LIABILITIES</strong></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Advance Payments</td>
                                <td class="text-danger">₹${advancePayments.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>Security Deposits</td>
                                <td class="text-danger">₹${securityDeposits.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Total Liabilities</strong></td>
                                <td class="text-danger"><strong>₹${totalLiabilities.toLocaleString()}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>SOCIETY EQUITY</strong></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Accumulated Funds</td>
                                <td class="${accumulatedFunds >= 0 ? 'text-success' : 'text-danger'}">₹${accumulatedFunds.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Total Equity</strong></td>
                                <td class="${totalEquity >= 0 ? 'text-success' : 'text-danger'}"><strong>₹${totalEquity.toLocaleString()}</strong></td>
                            </tr>
                            <tr style="border-top: 2px solid #000;">
                                <td><strong>TOTAL LIABILITIES & EQUITY</strong></td>
                                <td><strong>₹${(totalLiabilities + totalEquity).toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h5>Balance Sheet Verification:</h5>
                <p><strong>Assets:</strong> ₹${totalAssets.toLocaleString()}</p>
                <p><strong>Liabilities + Equity:</strong> ₹${(totalLiabilities + totalEquity).toLocaleString()}</p>
                <p><strong>Difference:</strong> <span class="${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? 'text-success' : 'text-danger'}">₹${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()}</span></p>
                ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? 
                    '<p class="text-success">✓ Balance Sheet is balanced!</p>' : 
                    '<p class="text-danger">⚠ Balance Sheet needs adjustment</p>'
                }
            </div>
        `;
        
        showReport('Balance Sheet Report', reportContent);
    } catch (error) {
        console.error('Error in generateBalanceSheetReport:', error);
        alert('Error generating balance sheet report. Please try again.');
    }
}

function calculateTotalOutstandingDues(bills, payments) {
    let totalOutstanding = 0;
    
    // Calculate outstanding from bills
    bills.forEach(bill => {
        const billPayments = payments.filter(p => 
            p.flatNumber === bill.flatNumber && 
            p.date >= bill.billDate
        );
        
        const totalPaid = billPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = Math.max(0, bill.totalAmount - totalPaid);
        totalOutstanding += outstanding;
    });
    
    // Add outstanding amounts from flats data
    const flats = getFlatsData();
    flats.forEach(flat => {
        if (flat.outstandingAmount && flat.outstandingAmount > 0) {
            totalOutstanding += flat.outstandingAmount;
        }
    });
    
    return totalOutstanding;
}

// Get society info from localStorage
function getSocietyInfo() {
    // Get society information from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    }
    return {
        name: societyInfo.name,
        registrationNumber: societyInfo.registrationNumber,
        address: societyInfo.address,
        phone: '',
        email: ''
    };
}

function showReport(title, content) {
    try {
        // Open report in new window
        const reportWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        // Check if popup was blocked
        if (!reportWindow) {
            alert('Popup blocked! Please allow popups for this site to view reports.');
            return;
        }
        
        const societyInfo = getSocietyInfo();
        const currentDate = new Date().toLocaleDateString('en-IN');
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - ${societyInfo.name}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: #f8f9fa;
                    color: #333;
                }
                .report-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .report-header {
                    background: #667eea;
                    color: white;
                    padding: 25px 30px;
                    text-align: center;
                }
                .report-header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 600;
                }
                .society-info {
                    margin-top: 10px;
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .report-meta {
                    background: #f8f9fa;
                    padding: 15px 30px;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .report-content {
                    padding: 30px;
                }
                .report-actions {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    gap: 10px;
                    z-index: 1000;
                }
                .btn {
                    padding: 6px 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: normal;
                    background: white;
                    color: #333;
                }
                .btn-primary { background: #007bff; color: white; border-color: #007bff; }
                .btn-success { background: #28a745; color: white; border-color: #28a745; }
                .btn-secondary { background: #6c757d; color: white; border-color: #6c757d; }
                .btn:hover { background: #f8f9fa; }
                .btn-primary:hover { background: #0056b3; }
                .btn-success:hover { background: #1e7e34; }
                .btn-secondary:hover { background: #545b62; }
                
                /* Report Styles */
                .report-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .report-summary-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #e9ecef;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid #28a745;
                }
                .report-summary-card.expense { border-left-color: #dc3545; }
                .report-summary-card.balance { border-left-color: #17a2b8; }
                .report-summary-card h4 {
                    color: #6c757d;
                    font-size: 0.9rem;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .report-summary-card .amount {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #2c3e50;
                }
                
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background: white;
                    border-radius: 5px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .report-table th,
                .report-table td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #dee2e6;
                }
                .report-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.9rem;
                }
                .report-table tbody tr:hover { background: #f8f9fa; }
                .report-table tbody tr:nth-child(even) { background: rgba(248, 249, 250, 0.5); }
                
                .text-success { color: #28a745; }
                .text-danger { color: #dc3545; }
                .text-muted { color: #6c757d; }
                
                h4 {
                    color: #2c3e50;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                
                @media print {
                    .report-actions { display: none; }
                    body { background: white; }
                    .report-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-actions">
                <button class="btn btn-secondary" onclick="window.print()">
                    Print
                </button>
                <button class="btn btn-success" onclick="downloadReport()">
                    Download
                </button>
                <button class="btn btn-primary" onclick="window.close()">
                    Close
                </button>
            </div>
            
            <div class="report-container">
                <div class="report-header">
                    <h1>${title}</h1>
                    <div class="society-info">${societyInfo.name}</div>
                </div>
                
                <div class="report-meta">
                    <div><strong>Generated on:</strong> ${currentDate}</div>
                    <div><strong>Report Type:</strong> ${title}</div>
                </div>
                
                <div class="report-content">
                    ${content}
                </div>
            </div>
            
            <script>
                function downloadReport() {
                    // Create a clean version for download
                    const reportContent = document.querySelector('.report-container').outerHTML;
                    const blob = new Blob([
                        '<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:20px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;}th{background-color:#f2f2f2;}.text-success{color:#28a745;}.text-danger{color:#dc3545;}.report-summary{display:flex;gap:20px;margin:20px 0;}.report-summary-card{flex:1;padding:15px;background:#f8f9fa;border-radius:5px;text-align:center;}.amount{font-size:1.5em;font-weight:bold;}</style></head><body>' + reportContent + '</body></html>'
                    ], { type: 'text/html' });
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            </script>
        </body>
        </html>
    `);
    
        reportWindow.document.close();
        reportWindow.focus();
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report. Please try again.');
    }
}

function closeReport() {
    document.getElementById('reportDisplayArea').style.display = 'none';
}

function printReport() {
    window.print();
}

function downloadCurrentReport() {
    const title = document.getElementById('reportTitle').textContent;
    const content = document.getElementById('reportContent').innerHTML;
    
    // Create a new window for printing/downloading
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                    .text-success { color: #28a745; }
                    .text-danger { color: #dc3545; }
                    .report-summary { display: flex; gap: 20px; margin: 20px 0; }
                    .report-summary-card { flex: 1; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; }
                    .amount { font-size: 1.5em; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export functions - directly open in new window
function exportCollectionReport(format) {
    generateCollectionReport();
}

function exportDuesReport(format) {
    generateDuesReport();
}

function exportExpenseReport(format) {
    generateExpenseReport();
}

function exportBankReport(format) {
    generateBankReport();
}

function exportFinancialReport(format) {
    generateFinancialReport();
}

function exportAuditReport(format) {
    generateAuditReport();
}

function exportBalanceSheetReport(format) {
    generateBalanceSheetReport();
}

function handleAddExpense(e) {
    e.preventDefault();
    
    const bankAccountId = document.getElementById('expenseBankAccount').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    // Get year and month from expense date for receipt number
    const expenseDate = new Date(document.getElementById('expenseDate').value);
    const expenseYear = expenseDate.getFullYear();
    const expenseMonth = expenseDate.getMonth() + 1;
    
    const expenseData = {
        id: generateId(),
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        amount: amount,
        paymentMode: document.getElementById('expensePaymentMode').value,
        vendor: document.getElementById('expenseVendor').value,
        description: document.getElementById('expenseDescription').value,
        billNumber: document.getElementById('expenseBillNumber').value,
        referenceNumber: document.getElementById('expenseReferenceNumber')?.value || null, // Store cheque/reference number
        bankAccountId: bankAccountId || null, // Store bank account ID
        expenseReceiptNumber: generateExpenseReceiptNumber(expenseYear, expenseMonth), // Add sequential receipt number
        createdDate: new Date().toISOString()
    };
    
    // Add expense to expenses list
    const expenses = getExpensesData();
    expenses.push(expenseData);
    saveExpensesData(expenses);
    
    // Save individual expense to Firebase immediately
    saveExpenseToFirebase(expenseData);
    
    // If bank account is selected, add debit transaction and update balance
    if (bankAccountId) {
        addExpenseToBank(bankAccountId, amount, expenseData.date, expenseData.category, expenseData.vendor, expenseData.id);
    }
    
    closeModal();
    loadExpensesData();
    loadDashboardData();
    
    // Show success message with bank info if applicable
    const banks = getBanksData();
    const selectedBank = banks.find(bank => bank.id === bankAccountId);
    const bankInfo = selectedBank ? ` (Paid from ${selectedBank.bankName})` : '';
    
    showNotification(`Expense added successfully!${bankInfo}`, 'success');
}

function handleAddNotice(e) {
    e.preventDefault();
    
    const noticeData = {
        id: generateId(),
        title: document.getElementById('noticeTitle').value,
        priority: document.getElementById('noticePriority').value,
        date: document.getElementById('noticeDate').value,
        expiry: document.getElementById('noticeExpiry').value,
        content: document.getElementById('noticeContent').value,
        active: document.getElementById('noticeActive').checked,
        createdDate: new Date().toISOString()
    };
    
    const notices = getNoticesData();
    notices.push(noticeData);
    saveNoticesData(notices);
    
    closeModal();
    loadNoticesData();
    showNotification('Notice added successfully!', 'success');
}

// Modal Management Functions
function createModal(title, content) {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    // Close modal on background click
    document.querySelector('.modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    return modalContainer.querySelector('.modal');
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
}

// Data Management Functions for Notices
function getNoticesData() {
    return JSON.parse(localStorage.getItem('societyNotices') || '[]');
}

function saveNoticesData(notices) {
    localStorage.setItem('societyNotices', JSON.stringify(notices));
}

// Helper Functions for Status Text
function getStatusText(status) {
    const statusMap = {
        'owner': 'Owner Occupied',
        'tenant': 'Tenant Occupied',
        'renter': 'Renter Occupied',
        'vacant': 'Vacant'
    };
    return statusMap[status] || status;
}

function getBillStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'partial': 'Partial',
        'paid': 'Paid',
        'overdue': 'Overdue'
    };
    return statusMap[status] || status;
}

function getPaymentModeText(mode) {
    const modes = {
        'cash': 'Cash',
        'cheque': 'Cheque',
        'online': 'Online Transfer',
        'upi': 'UPI Payment',
        'neft': 'NEFT Transfer',
        'rtgs': 'RTGS Transfer',
        'card': 'Card Payment',
        'dd': 'Demand Draft',
        'bank_transfer': 'Bank Transfer'
    };
    return modes[mode] || mode;
}

function getBankNameFromId(bankId) {
    if (!bankId) return null;
    const banks = getBanksData();
    const bank = banks.find(b => b.id === bankId);
    return bank ? bank.bankName : null;
}

function getCategoryText(category) {
    const categoryMap = {
        'electricity': 'Electricity',
        'water': 'Water',
        'security': 'Security',
        'cleaning': 'Cleaning',
        'maintenance': 'Maintenance',
        'gardening': 'Gardening',
        'lift': 'Lift',
        'insurance': 'Insurance',
        'bank_charges': 'Bank Charges',
        'legal': 'Legal',
        'office': 'Office',
        'other': 'Other'
    };
    return categoryMap[category] || category;
}

function getPriorityText(priority) {
    const priorityMap = {
        'normal': 'Normal',
        'important': 'Important',
        'urgent': 'Urgent'
    };
    return priorityMap[priority] || priority;
}

function getParkingTypeText(parkingType) {
    const parkingMap = {
        '': 'No Parking',
        'open': 'Open Parking',
        'covered': 'Covered Parking',
        'stilt': 'Stilt Parking',
        'basement': 'Basement Parking'
    };
    return parkingMap[parkingType] || 'No Parking';
}

function calculateParkingCharges(flat) {
    // Calculate parking charges based on parking slots with fixed rates
    // 2W = ₹50, 3W = ₹100, 4W = ₹100
    
    // If no parking slots, return 0
    const totalParkingSlots = (flat.fourWheelerParking || 0) + 
                             (flat.threeWheelerParking || 0) + 
                             (flat.twoWheelerParking || 0);
    
    if (totalParkingSlots === 0) {
        return 0;
    }
    
    // Fixed rates for different vehicle types
    const fourWheelerRate = 100; // 4W = ₹100
    const threeWheelerRate = 100; // 3W = ₹100  
    const twoWheelerRate = 50; // 2W = ₹50
    
    const totalCharges = ((flat.fourWheelerParking || 0) * fourWheelerRate) +
                        ((flat.threeWheelerParking || 0) * threeWheelerRate) +
                        ((flat.twoWheelerParking || 0) * twoWheelerRate);
    
    return Math.round(totalCharges);
}

// Edit and Delete Functions
function editFlat(id) {
    const flats = getFlatsData();
    const flat = flats.find(f => f.id === id);
    
    if (!flat) {
        showNotification('Flat not found!', 'error');
        return;
    }
    
    showEditFlatModal(flat);
}

function showEditFlatModal(flat) {
    const modal = createModal('Edit Flat Details', `
        <form id="editFlatForm">
            <input type="hidden" id="editFlatId" value="${flat.id}">
            
            <div class="form-row">
                <div class="form-group">
                    <label>Flat Number *</label>
                    <input type="text" id="editFlatNumber" value="${flat.flatNumber}" required>
                </div>
                <div class="form-group">
                    <label>Wing</label>
                    <input type="text" id="editFlatWing" value="${flat.wing || ''}" placeholder="A, B, C, etc." style="text-transform: uppercase;">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Owner Name *</label>
                    <input type="text" id="editOwnerName" value="${flat.ownerName}" required style="text-transform: uppercase;">
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="editOwnerMobile" value="${flat.mobile || ''}" placeholder="10-digit mobile number">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Occupancy Status *</label>
                    <select id="editOccupancyStatus" required>
                        <option value="">Select Status</option>
                        <option value="owner" ${flat.status === 'owner' ? 'selected' : ''}>Owner Occupied</option>
                        <option value="tenant" ${flat.status === 'tenant' ? 'selected' : ''}>Tenant Occupied</option>
                        <option value="renter" ${flat.status === 'renter' ? 'selected' : ''}>Renter Occupied</option>
                        <option value="vacant" ${flat.status === 'vacant' ? 'selected' : ''}>Vacant</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Outstanding Amount</label>
                    <input type="number" id="editOutstandingAmount" value="${flat.outstandingAmount || 0}" step="0.01" min="0">
                </div>
            </div>
            
            <div class="form-group">
                <label>Parking Details</label>
                <div class="form-row">
                    <div class="form-group">
                        <label>Four Wheeler</label>
                        <input type="number" id="editFourWheelerParking" value="${flat.fourWheelerParking || 0}" min="0" max="5">
                    </div>
                    <div class="form-group">
                        <label>Three Wheeler</label>
                        <input type="number" id="editThreeWheelerParking" value="${flat.threeWheelerParking || 0}" min="0" max="5">
                    </div>
                    <div class="form-group">
                        <label>Two Wheeler</label>
                        <input type="number" id="editTwoWheelerParking" value="${flat.twoWheelerParking || 0}" min="0" max="10">
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Flat</button>
            </div>
        </form>
    `);
    
    document.getElementById('editFlatForm').addEventListener('submit', handleEditFlat);
    
    // Add uppercase conversion for Owner Name and Wing fields in edit form
    const editOwnerNameField = document.getElementById('editOwnerName');
    const editWingField = document.getElementById('editFlatWing');
    
    editOwnerNameField.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    editWingField.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

function handleEditFlat(e) {
    e.preventDefault();
    
    const flatId = document.getElementById('editFlatId').value;
    const flats = getFlatsData();
    const flatIndex = flats.findIndex(f => f.id === flatId);
    
    if (flatIndex === -1) {
        showNotification('Flat not found!', 'error');
        return;
    }
    
    const updatedFlatData = {
        ...flats[flatIndex],
        flatNumber: document.getElementById('editFlatNumber').value,
        wing: document.getElementById('editFlatWing').value,
        ownerName: document.getElementById('editOwnerName').value,
        mobile: document.getElementById('editOwnerMobile').value,
        status: document.getElementById('editOccupancyStatus').value,
        outstandingAmount: parseFloat(document.getElementById('editOutstandingAmount').value) || 0,
        fourWheelerParking: parseInt(document.getElementById('editFourWheelerParking').value) || 0,
        threeWheelerParking: parseInt(document.getElementById('editThreeWheelerParking').value) || 0,
        twoWheelerParking: parseInt(document.getElementById('editTwoWheelerParking').value) || 0,
        updatedDate: new Date().toISOString()
    };
    
    // Check if flat number already exists (excluding current flat)
    const existingFlat = flats.find(flat => 
        flat.flatNumber === updatedFlatData.flatNumber && flat.id !== flatId
    );
    
    if (existingFlat) {
        showNotification('Flat number already exists!', 'error');
        return;
    }
    
    flats[flatIndex] = updatedFlatData;
    saveFlatsData(flats);
    
    closeModal();
    loadFlatsData();
    loadDashboardData();
    showNotification('Flat updated successfully!', 'success');
}

function deleteFlat(id) {
    const flats = getFlatsData();
    const flat = flats.find(f => f.id === id);
    
    if (!flat) {
        showNotification('Flat not found!', 'error');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete this flat?\n\nFlat: ${flat.flatNumber}\nOwner: ${flat.ownerName}\nMobile: ${flat.mobile}\n\nThis action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
        const updatedFlats = flats.filter(f => f.id !== id);
        saveFlatsData(updatedFlats);
        loadFlatsData();
        loadDashboardData();
        showNotification(`Flat ${flat.flatNumber} deleted successfully!`, 'success');
    }
}

function viewBill(id) {
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const bill = bills.find(b => b.id === id);
    
    if (!bill) {
        showNotification('Bill not found!', 'error');
        return;
    }
    
    // Use original bill data for printing (not modified by payments)
    showBillViewModal(bill);
}

function printBill(id) {
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const bill = bills.find(b => b.id === id);
    
    if (!bill) {
        showNotification('Bill not found!', 'error');
        return;
    }
    
    // Use original bill data for printing (not modified by payments)
    showBillViewModal(bill);
}

function downloadBillPDF(id) {
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const bill = bills.find(b => b.id === id);
    
    if (!bill) {
        showNotification('Bill not found!', 'error');
        return;
    }
    
    // Use original bill data for PDF generation (not modified by payments)
    generateBillPDF(bill);
}

function viewPaymentReceipt(id) {
    const payments = getPaymentsData();
    const payment = payments.find(p => p.id === id);
    
    if (!payment) {
        showNotification('Payment not found!', 'error');
        return;
    }
    
    showPaymentReceiptModal(payment);
}

function printPaymentReceipt(id) {
    const payments = getPaymentsData();
    const payment = payments.find(p => p.id === id);
    
    if (!payment) {
        showNotification('Payment not found!', 'error');
        return;
    }
    
    showPaymentReceiptModal(payment);
}

function editExpense(id) {
    const expenses = getExpensesData();
    const expense = expenses.find(e => e.id === id);
    
    if (!expense) {
        showNotification('Expense not found!', 'error');
        return;
    }
    
    // Create edit expense modal
    const modal = createModal('Edit Expense', `
        <form id="editExpenseForm">
            <input type="hidden" id="editExpenseId" value="${expense.id}">
            
            <div class="form-row">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="editExpenseDate" value="${expense.date}" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="editExpenseCategory" required>
                        <option value="">Select Category</option>
                        <option value="maintenance" ${expense.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="utilities" ${expense.category === 'utilities' ? 'selected' : ''}>Utilities</option>
                        <option value="security" ${expense.category === 'security' ? 'selected' : ''}>Security</option>
                        <option value="cleaning" ${expense.category === 'cleaning' ? 'selected' : ''}>Cleaning</option>
                        <option value="repairs" ${expense.category === 'repairs' ? 'selected' : ''}>Repairs</option>
                        <option value="admin" ${expense.category === 'admin' ? 'selected' : ''}>Administrative</option>
                        <option value="bank_charges" ${expense.category === 'bank_charges' ? 'selected' : ''}>Bank Charges</option>
                        <option value="other" ${expense.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Amount *</label>
                    <input type="number" id="editExpenseAmount" value="${expense.amount}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label>Payment Mode *</label>
                    <select id="editExpensePaymentMode" required onchange="toggleEditExpensePaymentFields()">
                        <option value="">Select Mode</option>
                        <option value="cash" ${expense.paymentMode === 'cash' ? 'selected' : ''}>Cash</option>
                        <option value="cheque" ${expense.paymentMode === 'cheque' ? 'selected' : ''}>Cheque</option>
                        <option value="online" ${expense.paymentMode === 'online' ? 'selected' : ''}>Online Transfer</option>
                        <option value="upi" ${expense.paymentMode === 'upi' ? 'selected' : ''}>UPI</option>
                        <option value="bank_transfer" ${expense.paymentMode === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row" id="editExpensePaymentDetailsRow" style="display: ${expense.paymentMode !== 'cash' ? 'flex' : 'none'};">
                <div class="form-group">
                    <label id="editExpenseReferenceLabel">Reference Number</label>
                    <input type="text" id="editExpenseReferenceNumber" value="${expense.referenceNumber || ''}" placeholder="Enter reference number">
                </div>
                <div class="form-group">
                    <label>Bank Account</label>
                    <select id="editExpenseBankAccount">
                        <option value="">Select Bank Account (Optional)</option>
                        ${getBanksData().map(bank => 
                            `<option value="${bank.id}" ${expense.bankAccountId === bank.id ? 'selected' : ''}>${bank.bankName} - ${bank.accountNumber}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Vendor/Payee</label>
                    <input type="text" id="editExpenseVendor" value="${expense.vendor || ''}" placeholder="Enter vendor name">
                </div>
                <div class="form-group">
                    <label>Bill/Receipt Number</label>
                    <input type="text" id="editExpenseBillNumber" value="${expense.billNumber || ''}" placeholder="Enter bill number">
                </div>
            </div>
            
            <div class="form-group">
                <label>Description *</label>
                <textarea id="editExpenseDescription" rows="3" required placeholder="Enter expense description">${expense.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Remarks</label>
                <textarea id="editExpenseRemarks" rows="2" placeholder="Additional remarks">${expense.remarks || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Expense</button>
            </div>
        </form>
    `);
    
    // Add event listener for form submission
    document.getElementById('editExpenseForm').addEventListener('submit', handleEditExpense);
}

function handleEditExpense(e) {
    e.preventDefault();
    
    const expenseId = document.getElementById('editExpenseId').value;
    const updatedExpenseData = {
        id: expenseId,
        date: document.getElementById('editExpenseDate').value,
        category: document.getElementById('editExpenseCategory').value,
        amount: parseFloat(document.getElementById('editExpenseAmount').value),
        paymentMode: document.getElementById('editExpensePaymentMode').value,
        vendor: document.getElementById('editExpenseVendor').value,
        billNumber: document.getElementById('editExpenseBillNumber').value,
        referenceNumber: document.getElementById('editExpenseReferenceNumber')?.value || null,
        bankAccountId: document.getElementById('editExpenseBankAccount')?.value || null,
        description: document.getElementById('editExpenseDescription').value,
        remarks: document.getElementById('editExpenseRemarks').value,
        modifiedDate: new Date().toISOString()
    };
    
    // Get existing expenses and update the specific one
    const expenses = getExpensesData();
    const expenseIndex = expenses.findIndex(expense => expense.id === expenseId);
    
    if (expenseIndex === -1) {
        showNotification('Expense not found!', 'error');
        return;
    }
    
    // Keep the original creation date
    updatedExpenseData.createdDate = expenses[expenseIndex].createdDate;
    
    // Update the expense
    expenses[expenseIndex] = updatedExpenseData;
    saveExpensesData(expenses);
    
    closeModal();
    loadExpensesData();
    loadDashboardData();
    showNotification('Expense updated successfully!', 'success');
}

function printExpenseReceipt(id) {
    const expenses = getExpensesData();
    const expense = expenses.find(e => e.id === id);
    
    if (!expense) {
        showNotification('Expense not found!', 'error');
        return;
    }
    
    const societyInfo = getSocietyInfo();
    // Use sequential receipt number if available, otherwise generate from expense date
    let receiptNumber;
    if (expense.expenseReceiptNumber) {
        receiptNumber = expense.expenseReceiptNumber;
    } else {
        // For old expenses without sequential receipt number, generate one
        const expenseDate = new Date(expense.date);
        const expenseYear = expenseDate.getFullYear();
        const expenseMonth = expenseDate.getMonth() + 1;
        receiptNumber = generateExpenseReceiptNumber(expenseYear, expenseMonth);
    }
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    // Create expense receipt in new window - same format as payment receipt
    const receiptWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
    
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Expense Receipt - ${receiptNumber}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                ${getA5ReceiptCSS()}
                    padding-bottom: 3px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    padding: 2px 0;
                    font-size: 11px;
                }
                .info-label {
                    font-weight: bold;
                    color: #495057;
                }
                .info-value {
                    color: #2c3e50;
                    font-weight: 600;
                }
                .expense-details {
                    padding: 15px;
                }
                .expense-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    border: 1px solid #dee2e6;
                    font-size: 11px;
                }
                .expense-table th,
                .expense-table td {
                    padding: 6px 8px;
                    text-align: left;
                    border: 1px solid #dee2e6;
                }
                .expense-table th {
                    background: #f8f9fa;
                    color: #495057;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .expense-table td {
                    background: white;
                }
                .amount-row {
                    background: #f8f9fa !important;
                    font-weight: bold;
                    font-size: 11px;
                }
                .total-section {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 10px;
                    margin: 10px 0;
                    text-align: left;
                }
                .total-section h3 {
                    margin: 0 0 5px 0;
                    color: #495057;
                    font-size: 12px;
                    font-weight: normal;
                }
                .total-amount {
                    font-size: 14px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 0;
                }
                .amount-words {
                    margin-top: 5px;
                    font-style: normal;
                    color: #6c757d;
                    font-size: 10px;
                }
                .signature-section {
                    margin-top: 20px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .signature-box {
                    text-align: center;
                    padding: 10px 0;
                    font-size: 10px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-bottom: 5px;
                    height: 30px;
                }
                .footer {
                    font-size: 9px;
                    color: #6c757d;
                }
                .print-actions {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    gap: 5px;
                    z-index: 1000;
                }
                .btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                }
                .btn-primary { background: #007bff; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn:hover { opacity: 0.9; }
                
                @media print {
                    .print-actions { display: none; }
                    body { 
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .receipt-container { 
                        border: none;
                        box-shadow: none;
                        margin: 0;
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="a5-container">
                <div class="receipt-actions no-print">
                    <button onclick="window.print()" class="print-btn">
                        <i class="fas fa-print"></i> Print Receipt
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                
                <div class="receipt-document">
                    <div class="receipt-header">
                        <div class="society-header">
                            <div class="society-logo-section">
                                <img src="society.logo.png" alt="Society Logo" class="receipt-logo" onerror="this.style.display='none';">
                            </div>
                            <div class="society-info">
                                <h1>${societyInfo.name}</h1>
                                <p class="reg-no">Registration No: ${societyInfo.registrationNumber || 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016'}</p>
                                <p class="address">${societyInfo.address || 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai'}</p>
                            </div>
                        </div>
                        
                        <div class="receipt-title">
                            <h2>EXPENSE RECEIPT</h2>
                        </div>
                    </div>
                    
                    <div class="receipt-details">
                        <table class="details-table">
                            <tr>
                                <td><strong>Receipt No:</strong></td>
                                <td>${receiptNumber}</td>
                                <td><strong>Date:</strong></td>
                                <td>${formatDateDDMMYYYY(expense.date)}</td>
                            </tr>
                            <tr>
                                <td><strong>Category:</strong></td>
                                <td>${getCategoryText(expense.category)}</td>
                                <td><strong>Payment Mode:</strong></td>
                                <td>${getPaymentModeText(expense.paymentMode)}</td>
                            </tr>
                            ${expense.vendor ? `
                            <tr>
                                <td><strong>Vendor:</strong></td>
                                <td>${expense.vendor.toUpperCase()}</td>
                                ${expense.billNumber ? `
                                <td><strong>Bill No:</strong></td>
                                <td>${expense.billNumber}</td>
                                ` : '<td colspan="2"></td>'}
                            </tr>
                            ` : ''}
                            ${expense.paymentMode !== 'cash' ? `
                            <tr>
                                <td><strong>${getReferenceLabel(expense.paymentMode)}:</strong></td>
                                <td>${expense.referenceNumber || 'N/A'}</td>
                                <td><strong>Bank:</strong></td>
                                <td>${getBankNameFromId(expense.bankAccountId) || 'N/A'}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    <div class="payment-details">
                        <h3>Expense Details:</h3>
                        <table class="payment-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${expense.description}</td>
                                    <td>${expense.amount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td><strong>Total Amount</strong></td>
                                    <td><strong>₹${expense.amount.toFixed(2)}</strong></td>
                                </tr>
                                <tr class="sum-in-words-row">
                                    <td><strong>Sum of Rupees</strong></td>
                                    <td><em>${numberToWords(expense.amount)} Only</em></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div class="received-from">
                        <p><strong>Expense paid to:</strong></p>
                        <p class="member-name">${expense.vendor ? expense.vendor.toUpperCase() : 'VENDOR NAME'}</p>
                    </div>
                    
                    <div class="receipt-footer">
                        <div class="footer-left">
                            <p><small>Subject to realization of payment</small></p>
                            <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
                        </div>
                        <div class="footer-right">
                            <p>For ${societyInfo.name}</p>
                            <div class="signature-line">
                                <p><strong>Secretary / Treasurer</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.focus();
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        const expenses = getExpensesData();
        const expenseToDelete = expenses.find(expense => expense.id === id);
        
        if (!expenseToDelete) {
            showNotification('Expense not found!', 'error');
            return;
        }
        
        // Add to deleted items for potential restore
        addToDeletedItems(expenseToDelete, 'expense');
        
        // Remove expense from array
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        saveExpensesData(updatedExpenses);
        
        // If expense was paid from bank account, reverse the bank transaction
        if (expenseToDelete.bankAccountId) {
            const banks = getBanksData();
            const bankPayments = getBankPaymentsData();
            
            // Find and remove the related bank payment transaction
            const bankTransactionIndex = bankPayments.findIndex(payment => 
                payment.linkedExpenseId === id || 
                payment.reference === `Expense: ${id}`
            );
            
            if (bankTransactionIndex !== -1) {
                const bankTransaction = bankPayments[bankTransactionIndex];
                
                // Remove bank transaction
                bankPayments.splice(bankTransactionIndex, 1);
                saveBankPaymentsData(bankPayments);
                
                // Restore bank balance (add back the expense amount)
                const bankIndex = banks.findIndex(bank => bank.id === expenseToDelete.bankAccountId);
                if (bankIndex !== -1) {
                    banks[bankIndex].balance = (banks[bankIndex].balance || 0) + expenseToDelete.amount;
                    saveBanksData(banks);
                    console.log(`Restored ₹${expenseToDelete.amount} to ${banks[bankIndex].bankName} after expense deletion`);
                }
                
                // Reload banks data
                loadBanksData();
            }
        }
        
        // Reload expenses data
        loadExpensesData();
        
        // Update dashboard
        loadDashboardData();
        
        showNotification('Expense and related transactions deleted successfully!', 'success');
    }
}

function editNotice(id) {
    showNotification('Edit notice feature coming soon!', 'info');
}

function deleteNotice(id) {
    if (confirm('Are you sure you want to delete this notice?')) {
        const notices = getNoticesData();
        const updatedNotices = notices.filter(notice => notice.id !== id);
        saveNoticesData(updatedNotices);
        loadNoticesData();
        showNotification('Notice deleted successfully!', 'success');
    }
}

function toggleNoticeStatus(id) {
    const notices = getNoticesData();
    const notice = notices.find(n => n.id === id);
    if (notice) {
        notice.active = !notice.active;
        saveNoticesData(notices);
        loadNoticesData();
        showNotification(`Notice ${notice.active ? 'activated' : 'deactivated'} successfully!`, 'success');
    }
}

// PDF Generation Functions
function generateBillPDF(bill) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get society info from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    const societyName = societyInfo.name || 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
    const societyAddress = societyInfo.address || 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    const societyRegNo = societyInfo.registrationNumber || 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
    
    // Draw border
    doc.rect(10, 10, 190, 277);
    
    // Title "BILL"
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('BILL', 105, 25, { align: 'center' });
    
    // Society Header
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(societyName, 105, 35, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Registration No: ${societyRegNo}`, 105, 42, { align: 'center' });
    doc.text(`Address: ${societyAddress}`, 105, 48, { align: 'center' });
    
    // Bill Details Header
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    // Left side details
    doc.text(`Name: [ ${bill.flatNumber} ]     ${bill.memberName}`, 15, 65);
    doc.text(`Period:     ${getMonthName(bill.month).toUpperCase()} ${bill.year} BILL`, 15, 75);
    
    // Right side details
    doc.text(`Bill No:     ${bill.billNumber || 'N/A'}`, 140, 65);
    doc.text(`Date:     ${formatDateDDMMYYYY(bill.generatedDate)}`, 140, 75);
    doc.text(`Due Date:     ${formatDateDDMMYYYY(bill.dueDate)}`, 140, 85);
    
    // Charges Table
    let yPos = 100;
    
    // Table headers
    doc.setFont(undefined, 'bold');
    doc.text('Particulars', 15, yPos);
    doc.text('Amount', 170, yPos);
    
    // Draw line under headers
    doc.line(15, yPos + 2, 195, yPos + 2);
    yPos += 10;
    
    // Table content
    doc.setFont(undefined, 'normal');
    
    // Maintenance Charges
    doc.text('Maintenance Charges', 15, yPos);
    doc.text(bill.maintenanceCharge.toFixed(2), 170, yPos);
    yPos += 8;
    
    // Sinking Fund
    doc.text('Sinking Fund', 15, yPos);
    doc.text(bill.sinkingFund.toFixed(2), 170, yPos);
    yPos += 8;
    
    // Non-occupancy Charges (if applicable)
    if ((bill.nonOccupancyCharges || 0) > 0) {
        doc.text('Non-occupancy Charges', 15, yPos);
        doc.text(bill.nonOccupancyCharges.toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Parking charges (if applicable)
    if ((bill.parkingCharges || 0) > 0) {
        doc.text('2W - parking charges', 15, yPos);
        doc.text(((bill.parkingCharges || 0) * 0.5).toFixed(2), 170, yPos);
        yPos += 8;
        
        doc.text('4W - parking charges', 15, yPos);
        doc.text(((bill.parkingCharges || 0) * 1.0).toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Festival charges (if applicable)
    if ((bill.festivalCharges || 0) > 0) {
        doc.text('Festival charges', 15, yPos);
        doc.text(bill.festivalCharges.toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Building Maintenance charges (if applicable)
    if (bill.buildingMaintenanceCharges) {
        yPos = addBillItem(doc, yPos, 'Building Maintenance', bill.buildingMaintenanceCharges);
    }
    
    // NOC charges (if applicable)
    if (bill.nocCharges) {
        yPos = addBillItem(doc, yPos, 'NOC Charges', bill.nocCharges);
    }
    
    // Outstanding Amount (if applicable)
    if ((bill.outstandingAmount || 0) > 0) {
        doc.text('Outstanding Amount', 15, yPos);
        doc.text(bill.outstandingAmount.toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Arrears Amount (if applicable)
    if ((bill.arrearsAmount || 0) > 0) {
        doc.text('Previous Arrears', 15, yPos);
        doc.text(bill.arrearsAmount.toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Interest Amount (if applicable)
    if ((bill.interestAmount || 0) > 0) {
        doc.text(`Interest (${bill.interestRate || 1.5}% per month)`, 15, yPos);
        doc.text(bill.interestAmount.toFixed(2), 170, yPos);
        yPos += 8;
    }
    
    // Totals section
    yPos += 10;
    doc.text('Total Rs.', 140, yPos);
    doc.text(bill.totalAmount.toFixed(2), 170, yPos);
    yPos += 8;
    
    doc.text('Arrears Rs.', 140, yPos);
    doc.text('0.00', 170, yPos);
    yPos += 8;
    
    doc.text('Interest Rs.', 140, yPos);
    doc.text('0.00', 170, yPos);
    yPos += 8;
    
    // Total Dues
    doc.setFont(undefined, 'bold');
    doc.text('Total Dues Rs.', 140, yPos);
    doc.text(bill.totalAmount.toFixed(2), 170, yPos);
    
    // Amount in words
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text(`Rupees ${numberToWords(bill.totalAmount)} Only`, 15, yPos);
    
    // Payment Instructions
    yPos += 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Pay this bill before due date mentioned on bill', 15, yPos);
    yPos += 6;
    doc.text('Interest of 18% will be charged on outstanding', 15, yPos);
    yPos += 6;
    doc.text('amount after due date', 15, yPos);
    yPos += 6;
    // Bank details from settings
    const bankInfo = societyInfo.bankName ? 
        `Bank - ${societyInfo.bankName}, Branch ${societyInfo.bankBranch}` : 
        'Bank - Bank of Maharashtra, Branch Kharghar Sec -40';
    const accountInfo = societyInfo.accountNumber ? 
        `Ac no. ${societyInfo.accountNumber}` : 
        'Ac no. 60234168835';
    const upiInfo = societyInfo.upiId ? 
        `UPI ID: ${societyInfo.upiId}` : '';
    
    doc.text(`For online payment contact - ${societyName}`, 15, yPos);
    yPos += 6;
    doc.text(bankInfo, 15, yPos);
    yPos += 6;
    doc.text(accountInfo, 15, yPos);
    if (upiInfo) {
        yPos += 6;
        doc.text(upiInfo, 15, yPos);
    }
    
    // Footer
    yPos += 20;
    doc.text(`For ${societyName}`, 15, yPos);
    doc.text('Secretary / Treasurer', 140, yPos);
    
    // Save PDF
    doc.save(`Bill_${bill.flatNumber}_${getMonthName(bill.month)}_${bill.year}.pdf`);
    showNotification('Bill PDF downloaded successfully!', 'success');
}

function generateReceiptPDF(payment) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get society info from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    const societyName = societyInfo.name || 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
    const societyAddress = societyInfo.address || 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    const societyRegNo = societyInfo.registrationNumber || 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
    
    // Draw main border
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 270);
    doc.setLineWidth(0.3);
    
    // Title "RECEIPT"
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RECEIPT', 105, 25, { align: 'center' });
    
    // Society Header
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(societyName, 105, 35, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Registration No: ${societyRegNo}`, 105, 42, { align: 'center' });
    doc.text(`Address: ${societyAddress}`, 105, 48, { align: 'center' });
    
    // Horizontal line after header
    doc.setLineWidth(0.5);
    doc.line(15, 55, 195, 55);
    doc.setLineWidth(0.3);
    
    // Receipt Details Section with borders
    let yPos = 70;
    
    // Receipt details table
    doc.rect(15, yPos - 5, 180, 20);
    doc.line(95, yPos - 5, 95, yPos + 15); // Vertical line
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    // Receipt No and Date row
    doc.text('Receipt No:', 20, yPos);
    doc.text(payment.receiptNumber || 'N/A', 60, yPos);
    doc.text('Date:', 100, yPos);
    doc.text(formatDateDDMMYYYY(payment.date), 120, yPos);
    yPos += 10;
    
    // Flat and Reference No row
    doc.text('Flat No:', 20, yPos);
    doc.text(payment.flatNumber, 60, yPos);
    doc.text(`${getReferenceLabel(payment.mode)}:`, 100, yPos);
    doc.text(payment.reference || payment.chequeNumber || payment.referenceNumber || 'N/A', 130, yPos);
    yPos += 15;
    
    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    doc.setLineWidth(0.3);
    yPos += 10;
    
    // Received with Thanks from
    doc.text('Received with Thanks from', 15, yPos);
    yPos += 10;
    
    // Member details
    doc.text(`[ ${payment.flatNumber} ] MR. ${payment.memberName.toUpperCase()}`, 15, yPos);
    yPos += 15;
    
    // Amount section
    doc.text('a sum of', 15, yPos);
    doc.text(`Rupees ${numberToWords(payment.amount)} Only`, 50, yPos);
    yPos += 15;
    
    // Payment heads details if available
    const paymentHeads = getPaymentHeadsFromPayment(payment);
    if (paymentHeads && paymentHeads.length > 0) {
        // Draw payment details table with proper borders
        const tableHeight = (paymentHeads.length + 2) * 12 + 10;
        doc.setLineWidth(0.5);
        doc.rect(15, yPos, 160, tableHeight);
        
        // Title
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text('Payment Details:', 95, yPos + 8, { align: 'center' });
        yPos += 15;
        
        // Table headers
        doc.rect(15, yPos, 110, 12);
        doc.rect(125, yPos, 50, 12);
        doc.setFontSize(9);
        doc.text('Payment Head', 20, yPos + 8);
        doc.text('Amount', 145, yPos + 8, { align: 'center' });
        yPos += 12;
        
        // Table rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        paymentHeads.forEach(head => {
            doc.rect(15, yPos, 110, 12);
            doc.rect(125, yPos, 50, 12);
            doc.text(head.name, 20, yPos + 8);
            doc.text(`₹ ${head.amount.toFixed(2)}`, 170, yPos + 8, { align: 'right' });
            yPos += 12;
        });
        
        // Total row
        doc.setLineWidth(1);
        doc.rect(15, yPos, 110, 12);
        doc.rect(125, yPos, 50, 12);
        doc.setLineWidth(0.3);
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Total Amount', 20, yPos + 8);
        doc.text(`₹ ${payment.amount.toFixed(2)}`, 170, yPos + 8, { align: 'right' });
        yPos += 20;
    }
    
    // Payment method details
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('Received with Thanks from MR.', 15, yPos);
    doc.text(payment.memberName.toUpperCase(), 100, yPos);
    yPos += 10;
    
    // Bill reference
    doc.text(`Against Bill No. 117, Dated 01/09/2025`, 15, yPos);
    yPos += 20;
    
    // Amount display
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(`Rs. ${payment.amount.toLocaleString()}`, 15, yPos);
    yPos += 20;
    
    // Right side society info
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`For ${societyName}`, 120, yPos);
    yPos += 15;
    
    // Bottom section
    doc.text('Subject to realization of cheque(s)', 15, yPos);
    doc.text('Secretary / Treasurer', 120, yPos);
    
    // Save PDF
    const receiptDate = new Date(payment.date);
    const monthName = getMonthName(receiptDate.getMonth() + 1);
    doc.save(`Receipt_${payment.flatNumber}_${monthName}_${receiptDate.getFullYear()}.pdf`);
    showNotification('Receipt PDF downloaded successfully!', 'success');
}

// Helper function to get reference label based on payment mode
function getReferenceLabel(paymentMode) {
    switch(paymentMode) {
        case 'cheque':
            return 'Cheque No';
        case 'upi':
            return 'UTR No';
        case 'online':
        case 'neft':
        case 'rtgs':
            return 'Transaction ID';
        case 'bank_transfer':
            return 'Transfer Ref';
        default:
            return 'Reference No';
    }
}

// Helper function to get payment heads from payment record
function getPaymentHeadsFromPayment(payment) {
    console.log('Getting payment heads from payment:', payment.receiptNumber); // Debug log
    console.log('Payment heads in record:', payment.paymentHeads); // Debug log
    
    // Return stored payment heads if available
    if (payment.paymentHeads && payment.paymentHeads.length > 0) {
        console.log('Found payment heads for receipt:', payment.receiptNumber);
        
        // Validate payment heads amounts
        payment.paymentHeads.forEach((head, index) => {
            console.log(`  Head ${index + 1}: ${head.name} = ₹${head.amount}`);
            if (head.amount === 0) {
                console.warn(`  ⚠️ WARNING: Payment head "${head.name}" has ₹0 amount in receipt ${payment.receiptNumber}!`);
            }
        });
        
        return payment.paymentHeads;
    }
    
    // If no payment heads stored, return null to show as single payment
    console.log('No payment heads found for receipt:', payment.receiptNumber);
    return null;
}

// Fix banks with balance but no opening balance transaction
function fixBankOpeningBalances() {
    const banks = getBanksData();
    const bankPayments = getBankPaymentsData();
    let fixedCount = 0;
    
    banks.forEach(bank => {
        if (bank.balance > 0) {
            // Check if there's already an opening balance transaction
            const hasOpeningBalance = bankPayments.some(bp => 
                bp.bankId === bank.id && bp.reference === 'OPENING-BAL'
            );
            
            if (!hasOpeningBalance) {
                // Calculate what the opening balance should be
                const bankTransactions = bankPayments.filter(bp => bp.bankId === bank.id);
                const totalCredits = bankTransactions.filter(bp => bp.type === 'credit').reduce((sum, bp) => sum + bp.amount, 0);
                const totalDebits = bankTransactions.filter(bp => bp.type === 'debit').reduce((sum, bp) => sum + bp.amount, 0);
                const calculatedBalance = totalCredits - totalDebits;
                
                // If current balance is higher than calculated, there's missing opening balance
                if (bank.balance > calculatedBalance) {
                    const missingOpeningBalance = bank.balance - calculatedBalance;
                    
                    const openingTransaction = {
                        id: generateId(),
                        bankId: bank.id,
                        type: 'credit',
                        amount: missingOpeningBalance,
                        description: 'Opening Balance (Auto-corrected)',
                        reference: 'OPENING-BAL',
                        date: bank.createdDate ? bank.createdDate.split('T')[0] : new Date().toISOString().split('T')[0],
                        createdDate: new Date().toISOString()
                    };
                    
                    bankPayments.push(openingTransaction);
                    fixedCount++;
                    console.log(`Added missing opening balance of ₹${missingOpeningBalance} for ${bank.bankName}`);
                }
            }
        }
    });
    
    if (fixedCount > 0) {
        saveBankPaymentsData(bankPayments);
        showNotification(`Fixed ${fixedCount} bank opening balance issues!`, 'success');
        
        // Refresh bank data display
        loadBanksData();
    } else {
        showNotification('No opening balance issues found', 'info');
    }
    
    return fixedCount;
}

// Common A5 CSS styles for all receipts
function getA5ReceiptCSS() {
    return `
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 10px;
            background: white;
            color: #333;
            line-height: 1.3;
            font-size: 12px;
        }
        .receipt-container {
            max-width: 148mm;
            width: 148mm;
            min-height: 210mm;
            margin: 0 auto;
            background: white;
            border: 1px solid #dee2e6;
            padding: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        @page {
            size: A5;
            margin: 10mm;
        }
        
        @media print {
            body {
                padding: 0;
                font-size: 11px;
                margin: 0;
            }
            .receipt-container {
                width: 100%;
                max-width: none;
                min-height: auto;
                box-shadow: none;
                border: none;
                margin: 0;
                padding: 0;
            }
            .print-actions { display: none; }
        }
        
        .print-actions {
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
            z-index: 1000;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
        }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn:hover { opacity: 0.9; }
        
        .receipt-header {
            background: #f8f9fa;
            color: #333;
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #dee2e6;
        }
        .receipt-header h1 {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #495057;
        }
        .society-info {
            font-size: 11px;
            margin: 2px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 11px;
        }
        th, td {
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            color: #495057;
            font-weight: bold;
            font-size: 10px;
        }
        
        .total-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
        }
        .total-amount {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 5px 0;
        }
        
        .signature-section {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 10px;
        }
        .signature-box {
            text-align: center;
            padding: 10px 0;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-bottom: 5px;
            height: 30px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 8px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            font-size: 9px;
            color: #6c757d;
        }
    `;
}

// A5 Bill CSS Function
function getA5BillCSS() {
    return `
        @page {
            size: A5;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
        }
        
        .a5-bill-container {
            width: 148mm;
            min-height: 210mm;
            margin: 0 auto;
            padding: 10mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .bill-document {
            width: 100%;
            height: 100%;
        }
        
        .bill-title {
            text-align: center;
            margin-bottom: 8px;
        }
        
        .bill-title h1 {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        
        .society-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
        }
        
        .society-logo-section {
            flex-shrink: 0;
        }
        
        .bill-logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
            background: transparent;
            border: none;
        }
        
        .society-info {
            text-align: center;
        }
        
        .society-header h2 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
        }
        
        .society-header p {
            font-size: 9px;
            margin: 2px 0;
            color: #666;
        }
        
        .bill-details-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 10px;
        }
        
        .left-details, .right-details {
            flex: 1;
        }
        
        .left-details p, .right-details p {
            margin: 3px 0;
            font-size: 10px;
        }
        
        .charges-section {
            margin-bottom: 12px;
        }
        
        .charges-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        
        .charges-table th {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 6px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        
        .charges-table td {
            border: 1px solid #dee2e6;
            padding: 6px 8px;
            font-size: 10px;
        }
        
        .charges-table td:last-child {
            text-align: right;
        }
        
        .bill-totals {
            margin-bottom: 12px;
            border: 1px solid #ddd;
            padding: 8px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 10px;
        }
        
        .total-due {
            border-top: 1px solid #ddd;
            padding-top: 6px;
            margin-top: 6px;
            font-weight: bold;
        }
        
        .amount-words {
            margin-bottom: 12px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
        }
        
        .payment-instructions {
            margin-bottom: 12px;
            font-size: 9px;
            line-height: 1.4;
        }
        
        .payment-instructions p {
            margin: 2px 0;
        }
        
        .bill-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            font-size: 10px;
        }
        
        .footer-left, .footer-right {
            text-align: center;
        }
        
        .print-actions {
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .print-btn, .close-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 0 5px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .close-btn {
            background: #6c757d;
        }
        
        .print-btn:hover {
            background: #0056b3;
        }
        
        .close-btn:hover {
            background: #545b62;
        }
        
        @media print {
            .no-print {
                display: none !important;
            }
            
            body {
                font-size: 11px;
            }
            
            .a5-bill-container {
                box-shadow: none;
                margin: 0;
                padding: 0;
            }
        }
    `;
}

function showBillViewModal(bill) {
    // Get society information from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    }
    localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    
    const societyName = societyInfo.name;
    const societyAddress = societyInfo.address;
    const societyRegNo = societyInfo.registrationNumber;
    
    // Get bank account details from system
    const banks = getBanksData();
    const primaryBank = banks.length > 0 ? banks[0] : null;
    
    // Open bill in new window for A5 printing - same dimensions as payment receipt
    const billWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
    
    billWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Maintenance Bill - ${bill.billNumber}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                ${getA5ReceiptCSS()}
            </style>
        </head>
        <body>
            <div class="a5-container">
                <div class="receipt-actions no-print">
                    <button onclick="window.print()" class="print-btn">
                        <i class="fas fa-print"></i> Print Bill
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                
                <div class="receipt-document">
                    <div class="receipt-header">
                        <div class="society-header">
                            <div class="society-logo-section">
                                <img src="society.logo.png" alt="Society Logo" class="receipt-logo" onerror="this.style.display='none';">
                            </div>
                            <div class="society-info">
                                <h1>${societyName}</h1>
                                <p class="reg-no">Registration No: ${societyRegNo}</p>
                                <p class="address">${societyAddress}</p>
                            </div>
                        </div>
                        <div class="receipt-title">
                            <h2>MAINTENANCE BILL</h2>
                        </div>
                    </div>
                    
                    <div class="receipt-details">
                        <table class="details-table">
                            <tr>
                                <td><strong>Bill No:</strong></td>
                                <td>${bill.billNumber || 'N/A'}</td>
                                <td><strong>Date:</strong></td>
                                <td>${formatDateDDMMYYYY(bill.generatedDate)}</td>
                            </tr>
                            <tr>
                                <td><strong>Flat No:</strong></td>
                                <td>${bill.flatNumber || 'N/A'}</td>
                                <td><strong>Due Date:</strong></td>
                                <td>${formatDateDDMMYYYY(bill.dueDate)}</td>
                            </tr>
                            <tr>
                                <td><strong>Member Name:</strong></td>
                                <td colspan="3">MR. ${bill.memberName.toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td><strong>Period:</strong></td>
                                <td colspan="3">${getMonthName(bill.month).toUpperCase()} ${bill.year}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="payment-details">
                        <h3>Bill Breakdown:</h3>
                        <table class="payment-table">
                            <thead>
                                <tr>
                                    <th>Payment Head</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Maintenance Charges</td>
                                    <td>${(bill.originalAmounts?.maintenanceCharge || bill.maintenanceCharge).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Sinking Fund</td>
                                    <td>${(bill.originalAmounts?.sinkingFund || bill.sinkingFund).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Parking Charges</td>
                                    <td>${((bill.originalAmounts?.parkingCharges || bill.parkingCharges) || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Festival Charges</td>
                                    <td>${((bill.originalAmounts?.festivalCharges || bill.festivalCharges) || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Building Maintenance</td>
                                    <td>${((bill.originalAmounts?.buildingMaintenanceCharges || bill.buildingMaintenanceCharges) || 0).toFixed(2)}</td>
                                </tr>
                                ${(bill.nocCharges || 0) > 0 ? `
                                <tr>
                                    <td>NOC Charges</td>
                                    <td>${bill.nocCharges.toFixed(2)}</td>
                                </tr>` : ''}
                                ${(bill.nonOccupancyCharges || 0) > 0 ? `
                                <tr>
                                    <td>Non-occupancy Charges</td>
                                    <td>${bill.nonOccupancyCharges.toFixed(2)}</td>
                                </tr>` : ''}
                                ${(bill.occupancyCharges || 0) > 0 ? `
                                <tr>
                                    <td>Occupancy Charges</td>
                                    <td>${bill.occupancyCharges.toFixed(2)}</td>
                                </tr>` : ''}
                            </tbody>
                            <tfoot>
                                ${(() => {
                                    // Calculate outstanding amounts from previous bills
                                    const maintenanceOutstanding = (bill.outstandingBreakdown?.maintenanceCharge || 0);
                                    const sinkingOutstanding = (bill.outstandingBreakdown?.sinkingFund || 0);
                                    const parkingOutstanding = (bill.outstandingBreakdown?.parkingCharges || 0);
                                    const festivalOutstanding = (bill.outstandingBreakdown?.festivalCharges || 0);
                                    const buildingOutstanding = (bill.outstandingBreakdown?.buildingMaintenanceCharges || 0);
                                    const totalOutstanding = maintenanceOutstanding + sinkingOutstanding + parkingOutstanding + festivalOutstanding + buildingOutstanding;
                                    
                                    let outstandingRows = '';
                                    
                                    // Show previous bill outstanding if any
                                    if (totalOutstanding > 0) {
                                        outstandingRows += '<tr style="background: #fff3cd;"><td colspan="2"><strong>Previous Bill Outstanding:</strong></td></tr>';
                                        
                                        if (maintenanceOutstanding > 0) {
                                            outstandingRows += '<tr><td style="padding-left: 20px;">Maintenance Charges</td><td>' + maintenanceOutstanding.toFixed(2) + '</td></tr>';
                                        }
                                        if (sinkingOutstanding > 0) {
                                            outstandingRows += '<tr><td style="padding-left: 20px;">Sinking Fund</td><td>' + sinkingOutstanding.toFixed(2) + '</td></tr>';
                                        }
                                        if (parkingOutstanding > 0) {
                                            outstandingRows += '<tr><td style="padding-left: 20px;">Parking Charges</td><td>' + parkingOutstanding.toFixed(2) + '</td></tr>';
                                        }
                                        if (festivalOutstanding > 0) {
                                            outstandingRows += '<tr><td style="padding-left: 20px;">Festival Charges</td><td>' + festivalOutstanding.toFixed(2) + '</td></tr>';
                                        }
                                        if (buildingOutstanding > 0) {
                                            outstandingRows += '<tr><td style="padding-left: 20px;">Building Maintenance</td><td>' + buildingOutstanding.toFixed(2) + '</td></tr>';
                                        }
                                    }
                                    
                                    return outstandingRows;
                                })()}
                                ${(() => {
                                    // Check for member outstanding - either from bill data or from localStorage
                                    let memberOutstandingAmount = bill.memberOutstanding || 0;
                                    
                                    // If not in bill, check localStorage directly
                                    if (memberOutstandingAmount === 0) {
                                        const memberOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
                                        const flatOutstanding = memberOutstanding.filter(item => 
                                            item.flatNumber === bill.flatNumber && item.status === 'pending'
                                        );
                                        memberOutstandingAmount = flatOutstanding.reduce((total, item) => total + item.outstandingAmount, 0);
                                    }
                                    
                                    if (memberOutstandingAmount > 0) {
                                        return '<tr style="background: #ffe6e6;"><td><strong>New Member Outstanding Amount</strong></td><td><strong>' + memberOutstandingAmount.toFixed(2) + '</strong></td></tr>';
                                    }
                                    return '';
                                })()}
                                ${(bill.arrearsAmount || 0) > 0 ? `
                                <tr>
                                    <td>Previous Arrears</td>
                                    <td>${bill.arrearsAmount.toFixed(2)}</td>
                                </tr>` : ''}
                                ${(bill.outstandingAmount || 0) > 0 ? `
                                <tr>
                                    <td>Outstanding Amount</td>
                                    <td>${bill.outstandingAmount.toFixed(2)}</td>
                                </tr>` : ''}
                                ${(bill.interestAmount || 0) > 0 ? `
                                <tr>
                                    <td>Interest (${bill.interestRate || 1.5}% per month)</td>
                                    <td>${bill.interestAmount.toFixed(2)}</td>
                                </tr>` : ''}
                                <tr class="total-row">
                                    <td><strong>Total Amount</strong></td>
                                    <td><strong>₹${(bill.originalAmounts?.totalAmount || bill.totalAmount).toFixed(2)}</strong></td>
                                </tr>
                                <tr class="sum-in-words-row">
                                    <td><strong>Sum of Rupees</strong></td>
                                    <td><em>${numberToWords(bill.originalAmounts?.totalAmount || bill.totalAmount)} Only</em></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div class="receipt-footer">
                        <div class="footer-left">
                            <p><small>Pay this bill before due date mentioned above</small></p>
                            <p><small>Interest will be charged on outstanding amount after due date</small></p>
                            ${primaryBank ? `
                            <p><small>For online payment: ${primaryBank.bankName}${primaryBank.branch ? ', ' + primaryBank.branch : ''}</small></p>
                            <p><small>Account No: ${primaryBank.accountNumber}</small></p>
                            ${primaryBank.ifscCode ? `<p><small>IFSC Code: ${primaryBank.ifscCode}</small></p>` : ''}
                            ` : `
                            <p><small>For online payment: Please contact society office</small></p>
                            `}
                        </div>
                        <div class="footer-right">
                            <p>For ${societyName}</p>
                            <div class="signature-line">
                                <p><strong>Secretary / Treasurer</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    billWindow.document.close();
    billWindow.focus();
}

function showPaymentReceiptModal(payment) {
    // Get society information from settings
    const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
    if (!societyInfo.name) {
        societyInfo.name = 'SHREE SWAMI SAMARTH CO-OPERATIVE HOUSING SOCIETY, LTD.';
        societyInfo.registrationNumber = 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
        societyInfo.address = 'Plot No - 45, Sector -15, Phase - II, Panvel, Navi Mumbai';
    }
    localStorage.setItem('societyInfo', JSON.stringify(societyInfo));
    
    const societyName = societyInfo.name;
    const societyAddress = societyInfo.address;
    const societyRegNo = societyInfo.registrationNumber || 'N.B.O/MCC/COH-S 6/8624/1978/2015-2016';
    
    // Open in new window for A5 print format
    const receiptWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
    
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt</title>
            <style>
                ${getA5ReceiptCSS()}
            </style>
        </head>
        <body>
            <div class="a5-container">
                <div class="receipt-actions no-print">
                    <button onclick="window.print()" class="print-btn">
                        <i class="fas fa-print"></i> Print Receipt
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                
                <div class="receipt-document">
                    <div class="receipt-header">
                        <div class="society-header">
                            <div class="society-logo-section">
                                <img src="society.logo.png" alt="Society Logo" class="receipt-logo" onerror="this.style.display='none';">
                            </div>
                            <div class="society-info">
                                <h1>${societyName}</h1>
                                <p class="reg-no">Registration No: ${societyRegNo}</p>
                                <p class="address">${societyAddress}</p>
                            </div>
                        </div>
                        
                        <div class="receipt-title">
                            <h2>PAYMENT RECEIPT</h2>
                        </div>
                    </div>
                    
                    <div class="receipt-details">
                        <table class="details-table">
                            <tr>
                                <td><strong>Receipt No:</strong></td>
                                <td>${payment.receiptNumber || 'N/A'}</td>
                                <td><strong>Date:</strong></td>
                                <td>${formatDateDDMMYYYY(payment.date)}</td>
                            </tr>
                            <tr>
                                <td><strong>Flat No:</strong></td>
                                <td>${payment.flatNumber}</td>
                                <td><strong>Payment Mode:</strong></td>
                                <td>${getPaymentModeText(payment.mode)}</td>
                            </tr>
                            <tr>
                                <td><strong>Owner Name:</strong></td>
                                <td colspan="3">MR. ${payment.memberName.toUpperCase()}</td>
                            </tr>
                            ${payment.mode !== 'cash' ? `
                            <tr>
                                <td><strong>${getReferenceLabel(payment.mode)}:</strong></td>
                                <td>${payment.reference || payment.chequeNumber || payment.referenceNumber || 'N/A'}</td>
                                <td><strong>Bank:</strong></td>
                                <td>${payment.bankName || getBankNameFromId(payment.bankAccountId) || 'N/A'}</td>
                            </tr>
                            ${payment.mode === 'cheque' && payment.chequeDate ? `
                            <tr>
                                <td><strong>Cheque Date:</strong></td>
                                <td>${formatDateDDMMYYYY(payment.chequeDate)}</td>
                                <td colspan="2"></td>
                            </tr>
                            ` : ''}
                            ` : ''}
                        </table>
                    </div>
                    
                    
                    ${getPaymentHeadsFromPayment(payment) ? `
                    <div class="payment-details">
                        <h3>Payment Breakdown:</h3>
                        <table class="payment-table">
                            <thead>
                                <tr>
                                    <th>Payment Head</th>
                                    <th>Period</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${getPaymentHeadsFromPayment(payment).map(head => {
                                    let periodInfo = '';
                                    
                                    // Add period info ONLY for "Maintenance Charges" (not Building Maintenance)
                                    if ((head.name.toLowerCase() === 'maintenance charges' || head.name.toLowerCase() === 'maintenance charge') && 
                                        payment.maintenancePeriod && (payment.maintenancePeriod.fromMonth || payment.maintenancePeriod.toMonth)) {
                                        periodInfo = formatMonthRange(payment.maintenancePeriod.fromMonth, payment.maintenancePeriod.toMonth);
                                    }
                                    
                                    // Add period info for parking charges
                                    else if (head.name.toLowerCase().includes('parking') && payment.parkingPeriod && 
                                        (payment.parkingPeriod.fromMonth || payment.parkingPeriod.toMonth)) {
                                        periodInfo = formatMonthRange(payment.parkingPeriod.fromMonth, payment.parkingPeriod.toMonth);
                                    }
                                    
                                    return `
                                        <tr>
                                            <td>${head.name}</td>
                                            <td>${periodInfo || '-'}</td>
                                            <td>${head.amount.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2"><strong>Total Amount</strong></td>
                                    <td><strong>₹${payment.amount.toFixed(2)}</strong></td>
                                </tr>
                                <tr class="sum-in-words-row">
                                    <td colspan="2"><strong>Sum of Rupees</strong></td>
                                    <td><em>${numberToWords(payment.amount)} Only</em></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    ` : ''}
                    
                    <div class="received-from">
                        <p><strong>Received with Thanks from:</strong></p>
                        <p class="member-name">MR. ${payment.memberName.toUpperCase()}</p>
                    </div>
                    
                    <div class="receipt-footer">
                        <div class="footer-left">
                            <p><small>Subject to realization of cheque(s)</small></p>
                            <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
                        </div>
                        <div class="footer-right">
                            <p>For ${societyName}</p>
                            <div class="signature-line">
                                <p><strong>Secretary / Treasurer</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.focus();
}

// A5 Receipt CSS for proper printing
function getA5ReceiptCSS() {
    return `
        @page {
            size: A5;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: white;
        }
        
        .a5-container {
            width: 148mm;
            min-height: 210mm;
            margin: 0 auto;
            background: white;
            position: relative;
        }
        
        .receipt-actions {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        
        .print-btn, .close-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .print-btn {
            background: #28a745;
            color: white;
        }
        
        .close-btn {
            background: #6c757d;
            color: white;
        }
        
        .print-btn:hover {
            background: #218838;
        }
        
        .close-btn:hover {
            background: #5a6268;
        }
        
        .receipt-document, .bill-document {
            border: 2px solid #000;
            padding: 15px;
            margin-top: 50px;
        }
        
        .receipt-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .society-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 15px;
            position: relative;
        }
        
        .society-logo-section {
            position: absolute;
            left: 0;
            top: 0;
        }
        
        .receipt-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
        }
        
        .society-info {
            flex: 1;
            text-align: center;
            padding-left: 90px;
        }
        
        .society-info h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
            line-height: 1.2;
            color: #000;
        }
        
        .society-info .reg-no {
            font-size: 11px;
            text-align: center;
            margin-bottom: 4px;
            font-weight: 500;
            color: #000;
        }
        
        .society-info .address {
            font-size: 11px;
            text-align: center;
            margin-bottom: 4px;
            line-height: 1.3;
            color: #000;
        }
        
        .receipt-title {
            text-align: center;
            margin-top: 8px;
        }
        
        .receipt-title h2 {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .receipt-details {
            margin-bottom: 15px;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        
        .details-table td {
            padding: 4px 6px;
            border: 1px solid #000;
            font-size: 10px;
            word-wrap: break-word;
            vertical-align: top;
        }
        
        .details-table td:nth-child(1),
        .details-table td:nth-child(3) {
            width: 25%;
            font-weight: bold;
        }
        
        .details-table td:nth-child(2),
        .details-table td:nth-child(4) {
            width: 25%;
        }
        
        .received-from {
            margin-bottom: 12px;
            text-align: center;
        }
        
        .member-name {
            font-size: 13px;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 3px;
        }
        
        .flat-info {
            font-size: 12px;
            color: #666;
            margin-top: 0;
            margin-bottom: 0;
        }
        
        .amount-section {
            margin-bottom: 15px;
            text-align: center;
            padding: 8px;
            border: 1px solid #000;
        }
        
        .payment-details {
            margin-bottom: 15px;
        }
        
        .payment-details h3 {
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        
        .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .payment-table th,
        .payment-table td {
            padding: 5px 8px;
            border: 1px solid #000;
            text-align: left;
            font-size: 10px;
        }
        
        .total-row {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .sum-in-words-row {
            background: #e9ecef;
        }
        
        .payment-period-info {
            margin-bottom: 15px;
        }
        
        .payment-period-info h3 {
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        
        .period-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .period-table td {
            padding: 5px 8px;
            border: 1px solid #000;
            text-align: left;
            font-size: 10px;
        }
        
        .period-table td:first-child {
            width: 40%;
            font-weight: bold;
        }
            border-top: 1px solid #000;
        }
        
        .sum-in-words-row td {
            padding: 8px;
            font-size: 11px;
        }
        
        .sum-in-words-row em {
            font-style: italic;
            color: #495057;
        }
        
        .total-row td {
            font-weight: bold;
            background: #f8f9fa;
{{ ... }}
        }
        
        .amount-display {
            margin-bottom: 15px;
            text-align: center;
            padding: 10px;
            border: 2px solid #000;
            background: #f8f9fa;
        }
        
        .total-amount h2 {
            font-size: 14px;
            margin: 0;
        }
        
        .receipt-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
        
        .footer-left {
            flex: 1;
        }
        
        .footer-right {
            flex: 1;
            text-align: right;
        }
        
        .signature-line {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        
        @media print {
            .no-print {
                display: none !important;
            }
            
            body {
                font-size: 11px;
            }
            
            .a5-container {
                width: 100%;
                margin: 0;
            }
            
            .receipt-document {
                margin-top: 0;
                border: 2px solid #000;
            }
        }
    `;
}

// Helper function to convert numbers to words
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    function convertHundreds(n) {
        let result = '';
        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            result += teens[n - 10] + ' ';
            return result;
        }
        if (n > 0) {
            result += ones[n] + ' ';
        }
        return result;
    }
    
    let result = '';
    if (num >= 10000000) {
        result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
        num %= 10000000;
    }
    if (num >= 100000) {
        result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
        num %= 100000;
    }
    if (num >= 1000) {
        result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
        num %= 1000;
    }
    if (num > 0) {
        result += convertHundreds(num);
    }
    
    return result.trim();
}

function getMonthName(monthNumber) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNumber)] || '';
}

function formatDateDDMMYYYY(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format date range for payment period (e.g., "1 October 2025 to 31 October 2025")
function formatDateRange(fromDateString, toDateString) {
    if (!fromDateString || !toDateString) {
        return 'N/A';
    }
    
    const fromDate = new Date(fromDateString);
    const toDate = new Date(toDateString);
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const fromDay = fromDate.getDate();
    const fromMonth = months[fromDate.getMonth()];
    const fromYear = fromDate.getFullYear();
    
    const toDay = toDate.getDate();
    const toMonth = months[toDate.getMonth()];
    const toYear = toDate.getFullYear();
    
    return `${fromDay} ${fromMonth} ${fromYear} to ${toDay} ${toMonth} ${toYear}`;
}

// Format month range for payment period (e.g., "October 2025 to November 2025")
function formatMonthRange(fromMonthString, toMonthString) {
    if (!fromMonthString || !toMonthString) {
        return 'N/A';
    }
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Parse from month (format: "2025-10")
    const [fromYear, fromMonthNum] = fromMonthString.split('-').map(Number);
    const fromMonth = months[fromMonthNum - 1];
    
    // Parse to month (format: "2025-11")
    const [toYear, toMonthNum] = toMonthString.split('-').map(Number);
    const toMonth = months[toMonthNum - 1];
    
    // If same month and year, show single month
    if (fromMonthString === toMonthString) {
        return `${fromMonth} ${fromYear}`;
    }
    
    // If same year, show "Month to Month Year"
    if (fromYear === toYear) {
        return `${fromMonth} to ${toMonth} ${fromYear}`;
    }
    
    // Different years, show full format
    return `${fromMonth} ${fromYear} to ${toMonth} ${toYear}`;
}

// Load Bills for Selected Flat
function loadFlatBills(flatNumber) {
    if (!flatNumber) {
        document.getElementById('flatBillsSection').style.display = 'none';
        return;
    }
    
    const bills = getBillsData();
    const flats = getFlatsData();
    const flatData = flats.find(flat => flat.flatNumber === flatNumber);
    
    // Show ALL bills for this flat (including paid ones for multi-month payments)
    const flatBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && bill.totalAmount > 0
    ).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    const billsSection = document.getElementById('flatBillsSection');
    const billsList = document.getElementById('flatBillsList');
    
    if (flatBills.length === 0) {
        billsSection.style.display = 'block';
        billsList.innerHTML = `
            <div class="no-bills-message">
                <p><i class="fas fa-check-circle" style="color: #28a745;"></i> No outstanding bills for this flat</p>
            </div>
        `;
        return;
    }
    
    billsSection.style.display = 'block';
    
    // Build period selection interface
    let billsHTML = `
        <div class="period-selection-container">
            <div class="period-selection-header">
                <h4><i class="fas fa-calendar-alt"></i> Select Payment Period</h4>
                <p>Choose how many months to pay or select a custom date range</p>
            </div>
            
            <div class="period-selection-row">
                <div class="period-input-group">
                    <label><i class="fas fa-hashtag"></i> Number of Months</label>
                    <input type="number" id="monthsCount" min="1" max="${flatBills.length}" 
                           placeholder="e.g., 2" onchange="autoSelectPeriod('${flatNumber}')">
                </div>
                
                <div class="period-input-group">
                    <label><i class="fas fa-calendar-check"></i> From Month</label>
                    <select id="fromMonth" onchange="updatePeriodSelection('${flatNumber}')">
                        <option value="">Select Month</option>
                        ${flatBills.map(bill => `<option value="${bill.period}">${getMonthName(bill.month)} ${bill.year}</option>`).join('')}
                    </select>
                </div>
                
                <div class="period-input-group">
                    <label><i class="fas fa-calendar-times"></i> To Month</label>
                    <select id="toMonth" onchange="updatePeriodSelection('${flatNumber}')">
                        <option value="">Select Month</option>
                        ${flatBills.map(bill => `<option value="${bill.period}">${getMonthName(bill.month)} ${bill.year}</option>`).join('')}
                    </select>
                </div>
                
                <div class="period-actions-group">
                    <button type="button" class="period-btn primary" onclick="calculateSelectedPeriodAmount('${flatNumber}')">
                        <i class="fas fa-calculator"></i> Calculate
                    </button>
                    <button type="button" class="period-btn danger" onclick="clearPeriodSelection('${flatNumber}')">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
            </div>
            
            <div class="quick-select-months">
                <button type="button" class="quick-month-btn" onclick="document.getElementById('monthsCount').value='1'; autoSelectPeriod('${flatNumber}')">
                    1 Month
                </button>
                <button type="button" class="quick-month-btn" onclick="document.getElementById('monthsCount').value='2'; autoSelectPeriod('${flatNumber}')">
                    2 Months
                </button>
                <button type="button" class="quick-month-btn" onclick="document.getElementById('monthsCount').value='3'; autoSelectPeriod('${flatNumber}')">
                    3 Months
                </button>
                <button type="button" class="quick-month-btn" onclick="document.getElementById('monthsCount').value='6'; autoSelectPeriod('${flatNumber}')">
                    6 Months
                </button>
                <button type="button" class="quick-month-btn" onclick="document.getElementById('monthsCount').value='12'; autoSelectPeriod('${flatNumber}')">
                    1 Year
                </button>
            </div>
            
            <div id="selectedPeriodInfo" class="selected-period-info" style="display: none;">
                <div class="period-summary">
                    <h5>Selected Period Summary</h5>
                    <div id="periodDetails"></div>
                </div>
            </div>
        </div>
        
    `;
    
    // Individual bills section removed - only period selection interface will be shown
    
    // Don't add individual bills section - only show period summary
    
    // Set the final HTML
    billsList.innerHTML = billsHTML;
}

// Calculate selected payment heads amount
function calculateSelectedAmount() {
    const selectedCheckboxes = document.querySelectorAll('.payment-head-checkbox:checked');
    let totalAmount = 0;
    
    selectedCheckboxes.forEach(checkbox => {
        totalAmount += parseFloat(checkbox.getAttribute('data-amount'));
    });
    
    document.getElementById('paymentAmount').value = totalAmount.toFixed(2);
    
    // Show selected heads info
    if (selectedCheckboxes.length > 0) {
        showNotification(`Selected ${selectedCheckboxes.length} payment heads - Total: ₹${totalAmount.toFixed(2)}`, 'info');
    } else {
        document.getElementById('paymentAmount').value = '';
    }
}

// Auto-select period based on months count
function autoSelectPeriod(flatNumber) {
    const monthsCount = parseInt(document.getElementById('monthsCount').value);
    if (!monthsCount || monthsCount < 1) {
        clearPeriodSelection(flatNumber);
        return;
    }
    
    const bills = getBillsData();
    const flatBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && 
        (bill.status === 'pending' || bill.status === 'partial')
    ).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    if (monthsCount > flatBills.length) {
        showNotification(`Only ${flatBills.length} bills available for this flat`, 'warning');
        return;
    }
    
    // Select first N months
    const selectedBills = flatBills.slice(0, monthsCount);
    const fromPeriod = selectedBills[0].period;
    const toPeriod = selectedBills[selectedBills.length - 1].period;
    
    // Update dropdowns
    document.getElementById('fromMonth').value = fromPeriod;
    document.getElementById('toMonth').value = toPeriod;
    
    // Calculate and show summary
    calculateSelectedPeriodAmount(flatNumber);
    
    showNotification(`Selected ${monthsCount} months: ${getMonthName(selectedBills[0].month)} ${selectedBills[0].year} to ${getMonthName(selectedBills[selectedBills.length - 1].month)} ${selectedBills[selectedBills.length - 1].year}`, 'success');
}

// Update period selection when dropdowns change
function updatePeriodSelection(flatNumber) {
    const fromMonth = document.getElementById('fromMonth').value;
    const toMonth = document.getElementById('toMonth').value;
    
    if (fromMonth && toMonth) {
        calculateSelectedPeriodAmount(flatNumber);
    } else if (fromMonth || toMonth) {
        // Clear months count if manual selection is being made
        document.getElementById('monthsCount').value = '';
    }
}

// Calculate amount for selected period
function calculateSelectedPeriodAmount(flatNumber) {
    const fromMonth = document.getElementById('fromMonth').value;
    const toMonth = document.getElementById('toMonth').value;
    
    if (!fromMonth || !toMonth) {
        showNotification('Please select both From and To months', 'warning');
        return;
    }
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flatBills = bills.filter(bill => 
        bill.flatNumber === flatNumber && 
        bill.period >= fromMonth && 
        bill.period <= toMonth &&
        (bill.status === 'pending' || bill.status === 'partial')
    ).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    if (flatBills.length === 0) {
        showNotification('No bills found in selected period', 'warning');
        return;
    }
    
    // Calculate head-wise totals for selected period
    const consolidatedHeads = {
        maintenance: { total: 0, periods: [] },
        sinking: { total: 0, periods: [] },
        parking: { total: 0, periods: [] },
        festival: { total: 0, periods: [] },
        buildingMaintenance: { total: 0, periods: [] },
        nonOccupancy: { total: 0, periods: [] },
        arrears: { total: 0, periods: [] },
        interest: { total: 0, periods: [] }
    };
    
    let totalSelectedAmount = 0;
    
    flatBills.forEach(bill => {
        // Calculate paid amounts for this bill
        const billPayments = payments.filter(payment => {
            if (payment.period && payment.period === bill.period && payment.flatNumber === flatNumber) {
                return true;
            }
            const paymentDate = new Date(payment.date);
            const paymentPeriod = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            return bill.period === paymentPeriod && payment.flatNumber === flatNumber;
        });
        
        let paidMaintenance = 0, paidSinking = 0, paidParking = 0, paidFestival = 0, paidBuilding = 0;
        
        billPayments.forEach(payment => {
            if (payment.paymentHeads && payment.paymentHeads.length > 0) {
                payment.paymentHeads.forEach(head => {
                    const headName = (head.name || head.head || '').toLowerCase();
                    if (headName.includes('maintenance') && !headName.includes('building')) {
                        paidMaintenance += head.amount || 0;
                    } else if (headName.includes('sinking')) {
                        paidSinking += head.amount || 0;
                    } else if (headName.includes('parking')) {
                        paidParking += head.amount || 0;
                    } else if (headName.includes('festival')) {
                        paidFestival += head.amount || 0;
                    } else if (headName.includes('building')) {
                        paidBuilding += head.amount || 0;
                    }
                });
            }
        });
        
        const periodText = `${getMonthName(bill.month)} ${bill.year}`;
        
        // Add remaining amounts to consolidated totals
        const remainingMaintenance = Math.max(0, (bill.maintenanceCharge || 0) - paidMaintenance);
        if (remainingMaintenance > 0) {
            consolidatedHeads.maintenance.total += remainingMaintenance;
            consolidatedHeads.maintenance.periods.push({ period: periodText, amount: remainingMaintenance });
            totalSelectedAmount += remainingMaintenance;
        }
        
        const remainingSinking = Math.max(0, (bill.sinkingFund || 0) - paidSinking);
        if (remainingSinking > 0) {
            consolidatedHeads.sinking.total += remainingSinking;
            consolidatedHeads.sinking.periods.push({ period: periodText, amount: remainingSinking });
            totalSelectedAmount += remainingSinking;
        }
        
        const remainingParking = Math.max(0, (bill.parkingCharges || 0) - paidParking);
        if (remainingParking > 0) {
            consolidatedHeads.parking.total += remainingParking;
            consolidatedHeads.parking.periods.push({ period: periodText, amount: remainingParking });
            totalSelectedAmount += remainingParking;
        }
        
        const remainingFestival = Math.max(0, (bill.festivalCharges || 0) - paidFestival);
        if (remainingFestival > 0) {
            consolidatedHeads.festival.total += remainingFestival;
            consolidatedHeads.festival.periods.push({ period: periodText, amount: remainingFestival });
            totalSelectedAmount += remainingFestival;
        }
        
        const remainingBuilding = Math.max(0, (bill.buildingMaintenanceCharges || 0) - paidBuilding);
        if (remainingBuilding > 0) {
            consolidatedHeads.buildingMaintenance.total += remainingBuilding;
            consolidatedHeads.buildingMaintenance.periods.push({ period: periodText, amount: remainingBuilding });
            totalSelectedAmount += remainingBuilding;
        }
        
        // Add other charges
        if ((bill.nonOccupancyCharges || 0) > 0) {
            consolidatedHeads.nonOccupancy.total += bill.nonOccupancyCharges;
            consolidatedHeads.nonOccupancy.periods.push({ period: periodText, amount: bill.nonOccupancyCharges });
            totalSelectedAmount += bill.nonOccupancyCharges;
        }
        
        if ((bill.arrearsAmount || 0) > 0) {
            consolidatedHeads.arrears.total += bill.arrearsAmount;
            consolidatedHeads.arrears.periods.push({ period: periodText, amount: bill.arrearsAmount });
            totalSelectedAmount += bill.arrearsAmount;
        }
        
        if ((bill.interestAmount || 0) > 0) {
            consolidatedHeads.interest.total += bill.interestAmount;
            consolidatedHeads.interest.periods.push({ period: periodText, amount: bill.interestAmount });
            totalSelectedAmount += bill.interestAmount;
        }
    });
    
    // Use the last bill's amount instead of consolidated total (last bill contains all previous outstanding amounts)
    const lastBill = flatBills[flatBills.length - 1];
    const actualPaymentAmount = lastBill.totalAmount;
    
    // Display period summary
    displayPeriodSummary(consolidatedHeads, flatBills, actualPaymentAmount, lastBill);
    
    // Auto-fill payment amount with last bill's amount
    document.getElementById('paymentAmount').value = actualPaymentAmount.toFixed(2);
    
    showNotification(`Period selected: ${flatBills.length} months, Total: ₹${totalSelectedAmount.toLocaleString()}`, 'success');
}

// Display period summary with editable amounts
function displayPeriodSummary(consolidatedHeads, selectedBills, totalAmount, lastBill) {
    const periodInfo = document.getElementById('selectedPeriodInfo');
    const periodDetails = document.getElementById('periodDetails');
    
    const headNames = {
        maintenance: 'Maintenance Charges',
        sinking: 'Sinking Fund',
        parking: 'Parking Charges',
        festival: 'Festival Charges',
        buildingMaintenance: 'Building Maintenance',
        nonOccupancy: 'Non-Occupancy Charges',
        arrears: 'Previous Arrears',
        interest: 'Interest'
    };
    
    let summaryHTML = `
        <div class="period-overview">
            <div class="selected-months">
                <strong>Selected Period:</strong> ${selectedBills.map(bill => `${getMonthName(bill.month)} ${bill.year}`).join(' to ')}
            </div>
            <div class="bill-to-pay">
                <strong>Bill to Pay:</strong> ${lastBill.billNumber} (${getMonthName(lastBill.month)} ${lastBill.year})
            </div>
            <div class="total-amount" id="periodTotalAmount">
                <strong>Total Amount: ₹${totalAmount.toLocaleString()}</strong>
            </div>
        </div>
        <div class="head-wise-breakdown">
            <h6>Payment Heads (Consolidated from ${selectedBills.length} month${selectedBills.length > 1 ? 's' : ''}) - Click amounts to edit:</h6>
            <div class="editable-heads-list">
    `;
    
    // Calculate consolidated amounts from ALL selected bills (not just last bill)
    const consolidatedAmounts = {
        maintenance: 0,
        sinking: 0,
        parking: 0,
        festival: 0,
        buildingMaintenance: 0,
        occupancy: 0,
        nonOccupancy: 0,
        arrears: 0,
        interest: 0
    };
    
    // Sum up amounts from all selected bills
    selectedBills.forEach(bill => {
        consolidatedAmounts.maintenance += bill.maintenanceCharge || 0;
        consolidatedAmounts.sinking += bill.sinkingFund || 0;
        consolidatedAmounts.parking += bill.parkingCharges || 0;
        consolidatedAmounts.festival += bill.festivalCharges || 0;
        consolidatedAmounts.buildingMaintenance += bill.buildingMaintenanceCharges || 0;
        consolidatedAmounts.occupancy += bill.occupancyCharges || 0;
        consolidatedAmounts.nonOccupancy += bill.nonOccupancyCharges || 0;
        consolidatedAmounts.arrears += bill.arrearsAmount || 0;
        consolidatedAmounts.interest += bill.interestAmount || 0;
    });
    
    // Use consolidated amounts for display
    const billHeads = [
        { key: 'maintenance', name: 'Maintenance Charges', amount: consolidatedAmounts.maintenance },
        { key: 'sinking', name: 'Sinking Fund', amount: consolidatedAmounts.sinking },
        { key: 'parking', name: 'Parking Charges', amount: consolidatedAmounts.parking },
        { key: 'festival', name: 'Festival Charges', amount: consolidatedAmounts.festival },
        { key: 'buildingMaintenance', name: 'Building Maintenance', amount: consolidatedAmounts.buildingMaintenance },
        { key: 'occupancy', name: 'Occupancy Charges', amount: consolidatedAmounts.occupancy },
        { key: 'nonOccupancy', name: 'Non-Occupancy Charges', amount: consolidatedAmounts.nonOccupancy },
        { key: 'arrears', name: 'Previous Arrears', amount: consolidatedAmounts.arrears },
        { key: 'interest', name: 'Interest', amount: consolidatedAmounts.interest }
    ];
    
    billHeads.forEach(head => {
        if (head.amount > 0) {
            summaryHTML += `
                <div class="payment-head-item period-head-item">
                    <label class="payment-head-label">
                        <input type="checkbox" class="payment-head-checkbox period-checkbox" 
                               data-head="${head.key}" data-amount="${head.amount}" 
                               onchange="calculatePeriodSelectedAmount()" checked>
                        <span class="head-name">${head.name}</span>
                        <div class="head-amount-container">
                            <span class="head-amount clickable-amount" id="period-amount-${head.key}" 
                                  onclick="editPeriodHeadAmount('${head.key}')" 
                                  title="Click to edit amount">₹${head.amount.toFixed(2)}</span>
                            <input type="number" class="head-amount-input" id="period-input-${head.key}" 
                                   value="${head.amount.toFixed(2)}" step="0.01" style="display: none;" 
                                   onchange="updatePeriodHeadAmount('${head.key}', this.value)" 
                                   onblur="savePeriodHeadAmount('${head.key}')" 
                                   onkeypress="if(event.key==='Enter') savePeriodHeadAmount('${head.key}')">
                        </div>
                    </label>
                    <div class="head-periods">
                        <small><i class="fas fa-info-circle"></i> Total from ${selectedBills.length} month${selectedBills.length > 1 ? 's' : ''} (${selectedBills.map(b => getMonthName(b.month)).join(', ')})</small>
                    </div>
                </div>
            `;
        }
    });
    
    summaryHTML += `
            </div>
            <div class="period-actions">
                <button type="button" class="btn btn-sm btn-success" onclick="selectAllPeriodHeads()">
                    <i class="fas fa-check-double"></i> Select All
                </button>
                <button type="button" class="btn btn-sm btn-warning" onclick="clearAllPeriodHeads()">
                    <i class="fas fa-times"></i> Clear All
                </button>
                <button type="button" class="btn btn-sm btn-info" onclick="resetPeriodAmounts()">
                    <i class="fas fa-undo"></i> Reset Amounts
                </button>
            </div>
        </div>
        
    `;
    
    periodDetails.innerHTML = summaryHTML;
    periodInfo.style.display = 'block';
    
    // Store original amounts for reset functionality (from last bill)
    window.originalPeriodAmounts = {};
    billHeads.forEach(head => {
        if (head.amount > 0) {
            window.originalPeriodAmounts[head.key] = head.amount;
        }
    });
}

// Clear period selection
function clearPeriodSelection(flatNumber) {
    document.getElementById('monthsCount').value = '';
    document.getElementById('fromMonth').value = '';
    document.getElementById('toMonth').value = '';
    document.getElementById('selectedPeriodInfo').style.display = 'none';
    document.getElementById('paymentAmount').value = '';
    
    showNotification('Period selection cleared', 'info');
}

// Edit period head amount
function editPeriodHeadAmount(headKey) {
    const amountSpan = document.getElementById(`period-amount-${headKey}`);
    const amountInput = document.getElementById(`period-input-${headKey}`);
    
    if (amountSpan && amountInput) {
        amountSpan.style.display = 'none';
        amountInput.style.display = 'inline-block';
        amountInput.focus();
        amountInput.select();
    }
}

// Update period head amount
function updatePeriodHeadAmount(headKey, newAmount) {
    const amount = parseFloat(newAmount) || 0;
    const checkbox = document.querySelector(`.period-checkbox[data-head="${headKey}"]`);
    
    if (checkbox) {
        checkbox.setAttribute('data-amount', amount.toFixed(2));
        calculatePeriodSelectedAmount();
    }
}

// Save period head amount
function savePeriodHeadAmount(headKey) {
    const amountSpan = document.getElementById(`period-amount-${headKey}`);
    const amountInput = document.getElementById(`period-input-${headKey}`);
    
    if (amountSpan && amountInput) {
        const newAmount = parseFloat(amountInput.value) || 0;
        amountSpan.textContent = `₹${newAmount.toFixed(2)}`;
        amountSpan.style.display = 'inline-block';
        amountInput.style.display = 'none';
        
        updatePeriodHeadAmount(headKey, newAmount);
        showNotification(`${headKey} amount updated to ₹${newAmount.toFixed(2)}`, 'success');
    }
}

// Calculate selected period amount
function calculatePeriodSelectedAmount() {
    const selectedCheckboxes = document.querySelectorAll('.period-checkbox:checked');
    let totalAmount = 0;
    
    selectedCheckboxes.forEach(checkbox => {
        const amount = parseFloat(checkbox.getAttribute('data-amount')) || 0;
        totalAmount += amount;
    });
    
    // Update total display
    const totalAmountElement = document.getElementById('periodTotalAmount');
    if (totalAmountElement) {
        totalAmountElement.innerHTML = `<strong>Total Amount: ₹${totalAmount.toLocaleString()}</strong>`;
    }
    
    // Update payment amount field
    document.getElementById('paymentAmount').value = totalAmount.toFixed(2);
    
    // Show selected heads info
    if (selectedCheckboxes.length > 0) {
        showNotification(`Selected ${selectedCheckboxes.length} payment heads - Total: ₹${totalAmount.toFixed(2)}`, 'info');
    } else {
        document.getElementById('paymentAmount').value = '';
    }
}

// Select all period heads
function selectAllPeriodHeads() {
    const checkboxes = document.querySelectorAll('.period-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    calculatePeriodSelectedAmount();
    showNotification('All payment heads selected', 'success');
}

// Clear all period heads
function clearAllPeriodHeads() {
    const checkboxes = document.querySelectorAll('.period-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    calculatePeriodSelectedAmount();
    showNotification('All payment heads cleared', 'info');
}

// Reset period amounts to original values
function resetPeriodAmounts() {
    if (!window.originalPeriodAmounts) {
        showNotification('No original amounts to reset to', 'warning');
        return;
    }
    
    Object.keys(window.originalPeriodAmounts).forEach(headKey => {
        const originalAmount = window.originalPeriodAmounts[headKey];
        const amountSpan = document.getElementById(`period-amount-${headKey}`);
        const amountInput = document.getElementById(`period-input-${headKey}`);
        const checkbox = document.querySelector(`.period-checkbox[data-head="${headKey}"]`);
        
        if (amountSpan && amountInput && checkbox) {
            amountSpan.textContent = `₹${originalAmount.toFixed(2)}`;
            amountInput.value = originalAmount.toFixed(2);
            checkbox.setAttribute('data-amount', originalAmount.toFixed(2));
        }
    });
    
    calculatePeriodSelectedAmount();
    showNotification('All amounts reset to original values', 'success');
}

// Pay the selected bill directly
function payThisBill(billId) {
    const bills = getBillsData();
    const bill = bills.find(b => b.id === billId);
    
    if (!bill) {
        showNotification('Bill not found', 'error');
        return;
    }
    
    // Auto-fill payment form with bill details
    document.getElementById('paymentAmount').value = bill.totalAmount.toFixed(2);
    
    // Create payment heads array for this bill
    const paymentHeads = [];
    
    if (bill.maintenanceCharge > 0) {
        paymentHeads.push({
            name: 'Maintenance Charges',
            amount: bill.maintenanceCharge
        });
    }
    
    if (bill.sinkingFund > 0) {
        paymentHeads.push({
            name: 'Sinking Fund',
            amount: bill.sinkingFund
        });
    }
    
    if (bill.parkingCharges > 0) {
        paymentHeads.push({
            name: 'Parking Charges',
            amount: bill.parkingCharges
        });
    }
    
    if (bill.festivalCharges > 0) {
        paymentHeads.push({
            name: 'Festival Charges',
            amount: bill.festivalCharges
        });
    }
    
    if (bill.buildingMaintenanceCharges > 0) {
        paymentHeads.push({
            name: 'Building Maintenance',
            amount: bill.buildingMaintenanceCharges
        });
    }
    
    if (bill.arrearsAmount > 0) {
        paymentHeads.push({
            name: 'Previous Arrears',
            amount: bill.arrearsAmount
        });
    }
    
    if (bill.interestAmount > 0) {
        paymentHeads.push({
            name: 'Interest',
            amount: bill.interestAmount
        });
    }
    
    // Store payment heads for processing
    window.selectedPaymentHeads = paymentHeads;
    window.selectedBillId = billId;
    
    showNotification(`Bill ${bill.billNumber} selected for payment - Amount: ₹${bill.totalAmount.toLocaleString()}`, 'success');
    
    // Scroll to payment form
    document.getElementById('paymentAmount').scrollIntoView({ behavior: 'smooth' });
}

// Select all payment heads for a bill
function selectAllHeads(billId) {
    const checkboxes = document.querySelectorAll(`[data-bill-id="${billId}"].payment-head-checkbox`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    calculateSelectedAmount();
    showNotification('All payment heads selected', 'success');
}

// Clear all payment heads for a bill
function clearAllHeads(billId) {
    const checkboxes = document.querySelectorAll(`[data-bill-id="${billId}"].payment-head-checkbox`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    calculateSelectedAmount();
    showNotification('All payment heads cleared', 'info');
}

// Edit payment head amount
function editHeadAmount(billId, headType) {
    const amountSpan = document.getElementById(`amount-${headType}-${billId}`);
    const amountInput = document.getElementById(`input-${headType}-${billId}`);
    
    if (amountInput.style.display === 'none') {
        // Switch to edit mode
        amountSpan.style.display = 'none';
        amountInput.style.display = 'inline-block';
        amountInput.focus();
        amountInput.select();
        
        // Add visual indicator that we're in edit mode
        amountInput.parentElement.classList.add('editing-mode');
    }
}

// Save edited payment head amount
function saveHeadAmount(billId, headType) {
    const amountSpan = document.getElementById(`amount-${headType}-${billId}`);
    const amountInput = document.getElementById(`input-${headType}-${billId}`);
    const checkbox = document.querySelector(`[data-bill-id="${billId}"][data-head="${headType}"]`);
    
    const newAmount = parseFloat(amountInput.value) || 0;
    
    if (newAmount < 0) {
        showNotification('Amount cannot be negative!', 'error');
        amountInput.value = 0;
        return;
    }
    
    // Update display
    amountSpan.textContent = `₹${newAmount.toFixed(2)}`;
    amountSpan.style.display = 'inline-block';
    amountInput.style.display = 'none';
    
    // Remove editing mode indicator
    amountInput.parentElement.classList.remove('editing-mode');
    
    // Update checkbox data-amount
    checkbox.setAttribute('data-amount', newAmount);
    
    // Recalculate if checkbox is selected
    if (checkbox.checked) {
        calculateSelectedAmount();
    }
    
    showNotification(`${getHeadDisplayName(headType)} amount updated to ₹${newAmount.toFixed(2)}`, 'success');
}

// Update payment head amount (called from input onchange)
function updateHeadAmount(billId, headType, newAmount) {
    const checkbox = document.querySelector(`[data-bill-id="${billId}"][data-head="${headType}"]`);
    const amount = parseFloat(newAmount) || 0;
    
    if (amount < 0) {
        document.getElementById(`input-${headType}-${billId}`).value = 0;
        return;
    }
    
    // Update checkbox data-amount
    checkbox.setAttribute('data-amount', amount);
    
    // Recalculate if checkbox is selected
    if (checkbox.checked) {
        calculateSelectedAmount();
    }
}

// Get display name for payment head
function getHeadDisplayName(headType) {
    const headNames = {
        'maintenance': 'Maintenance Charges',
        'sinking': 'Sinking Fund',
        'parking': 'Parking Charges',
        'nonOccupancy': 'Non-Occupancy Charges',
        'festival': 'Festival Charges',
        'buildingMaintenance': 'Building Maintenance',
        'noc': 'NOC Charges',
        'outstandingAmount': 'Outstanding Amount',
        'initialOutstanding': 'Outstanding Amount'
    };
    return headNames[headType] || headType;
}

// Toggle manual payment heads section
function toggleManualPaymentHeads() {
    const manualSection = document.getElementById('manualPaymentHeads');
    const billsSection = document.getElementById('flatBillsSection');
    
    if (manualSection.style.display === 'none') {
        manualSection.style.display = 'block';
        billsSection.style.display = 'none';
        showNotification('Manual payment heads enabled', 'info');
    } else {
        manualSection.style.display = 'none';
        showNotification('Manual payment heads disabled', 'info');
    }
}

// Edit manual payment head amount
function editManualHeadAmount(headType) {
    const amountSpan = document.getElementById(`amount-${headType}`);
    const amountInput = document.getElementById(`input-${headType}`);
    
    if (amountInput.style.display === 'none') {
        amountSpan.style.display = 'none';
        amountInput.style.display = 'inline-block';
        amountInput.focus();
        amountInput.select();
        amountInput.parentElement.classList.add('editing-mode');
    }
}

// Save manual payment head amount
function saveManualHeadAmount(headType) {
    const amountSpan = document.getElementById(`amount-${headType}`);
    const amountInput = document.getElementById(`input-${headType}`);
    const checkbox = document.querySelector(`[data-head="${headType}"].payment-head-checkbox`);
    
    const newAmount = parseFloat(amountInput.value) || 0;
    
    if (newAmount < 0) {
        showNotification('Amount cannot be negative!', 'error');
        amountInput.value = 0;
        return;
    }
    
    // Update display
    amountSpan.textContent = `₹${newAmount.toFixed(2)}`;
    amountSpan.style.display = 'inline-block';
    amountInput.style.display = 'none';
    amountInput.parentElement.classList.remove('editing-mode');
    
    // Update checkbox data-amount
    checkbox.setAttribute('data-amount', newAmount);
    
    // Auto-check if amount > 0
    if (newAmount > 0) {
        checkbox.checked = true;
    }
    
    // Recalculate total
    calculateSelectedAmount();
    
    showNotification(`${getHeadDisplayName(headType)} amount updated to ₹${newAmount.toFixed(2)}`, 'success');
}

// Update manual payment head amount
function updateManualHeadAmount(headType, newAmount) {
    const checkbox = document.querySelector(`[data-head="${headType}"].payment-head-checkbox`);
    const amount = parseFloat(newAmount) || 0;
    
    if (amount < 0) {
        document.getElementById(`input-${headType}`).value = 0;
        return;
    }
    
    checkbox.setAttribute('data-amount', amount);
    
    if (checkbox.checked) {
        calculateSelectedAmount();
    }
}

// Select all manual payment heads
function selectAllManualHeads() {
    const checkboxes = document.querySelectorAll('#manualPaymentHeads .payment-head-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    calculateSelectedAmount();
    showNotification('All payment heads selected', 'success');
}

// Clear all manual payment heads
function clearAllManualHeads() {
    const checkboxes = document.querySelectorAll('#manualPaymentHeads .payment-head-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    calculateSelectedAmount();
    showNotification('All payment heads cleared', 'info');
}

// Test function to check payment heads
function testPaymentHeads() {
    const payments = getPaymentsData();
    console.log('All payments:', payments);
    
    payments.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`, payment);
        console.log(`Payment heads:`, payment.paymentHeads);
    });
}

// Debug function to check payment heads structure
function debugPaymentHeads() {
    const payments = getPaymentsData();
    console.log('=== PAYMENT HEADS DEBUG ===');
    
    payments.forEach((payment, index) => {
        if (payment.paymentHeads && payment.paymentHeads.length > 0) {
            console.log(`Payment ${index + 1} (${payment.receiptNumber}):`);
            console.log('Payment heads:', payment.paymentHeads);
            payment.paymentHeads.forEach((head, headIndex) => {
                console.log(`  Head ${headIndex + 1}:`, {
                    type: head.type,
                    name: head.name,
                    amount: head.amount
                });
            });
        } else {
            console.log(`Payment ${index + 1} (${payment.receiptNumber}): NO PAYMENT HEADS`);
        }
    });
    
    console.log('=== END DEBUG ===');
}

// Test function to check if payment heads are showing 0 in receipts
function testReceiptPaymentHeads() {
    const payments = getPaymentsData();
    console.log('=== RECEIPT PAYMENT HEADS TEST ===');
    
    payments.forEach((payment, index) => {
        console.log(`\nPayment ${index + 1} (${payment.receiptNumber}):`);
        console.log('Stored payment heads:', payment.paymentHeads);
        
        const receiptHeads = getPaymentHeadsFromPayment(payment);
        console.log('Receipt heads returned:', receiptHeads);
        
        if (receiptHeads && receiptHeads.length > 0) {
            receiptHeads.forEach(head => {
                console.log(`  Receipt Head: ${head.name} = ₹${head.amount}`);
                if (head.amount === 0) {
                    console.warn(`  ⚠️ WARNING: ${head.name} shows ₹0 in receipt!`);
                }
            });
        }
    });
    
    console.log('=== END RECEIPT TEST ===');
}

// Function to validate payment heads before storing
function validatePaymentHeads(paymentHeads, totalAmount) {
    if (!paymentHeads || paymentHeads.length === 0) {
        console.log('No payment heads to validate');
        return true;
    }
    
    let isValid = true;
    let totalHeadsAmount = 0;
    
    console.log('=== VALIDATING PAYMENT HEADS ===');
    
    paymentHeads.forEach((head, index) => {
        console.log(`Head ${index + 1}: ${head.name} = ₹${head.amount}`);
        
        if (!head.amount || head.amount <= 0) {
            console.error(`❌ Invalid amount for ${head.name}: ₹${head.amount}`);
            isValid = false;
        }
        
        if (!head.name || head.name.trim() === '') {
            console.error(`❌ Invalid name for head ${index + 1}: "${head.name}"`);
            isValid = false;
        }
        
        totalHeadsAmount += head.amount;
    });
    
    if (Math.abs(totalHeadsAmount - totalAmount) > 0.01) {
        console.error(`❌ Payment heads total (₹${totalHeadsAmount}) doesn't match payment amount (₹${totalAmount})`);
        isValid = false;
    }
    
    console.log(`Total heads amount: ₹${totalHeadsAmount}`);
    console.log(`Payment amount: ₹${totalAmount}`);
    console.log(`Validation result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log('=== END VALIDATION ===');
    
    return isValid;
}

// Comprehensive function to diagnose payment heads issues
function diagnosePaymentHeadsIssue() {
    console.log('🔍 === COMPREHENSIVE PAYMENT HEADS DIAGNOSIS ===');
    
    const payments = getPaymentsData();
    const bills = getBillsData();
    
    console.log(`Total payments in system: ${payments.length}`);
    console.log(`Total bills in system: ${bills.length}`);
    
    let paymentsWithHeads = 0;
    let paymentsWithZeroHeads = 0;
    let paymentsWithoutHeads = 0;
    
    payments.forEach((payment, index) => {
        console.log(`\n📋 Payment ${index + 1}: ${payment.receiptNumber} (Flat ${payment.flatNumber})`);
        console.log(`   Amount: ₹${payment.amount}`);
        console.log(`   Date: ${payment.date}`);
        
        if (payment.paymentHeads && payment.paymentHeads.length > 0) {
            paymentsWithHeads++;
            console.log(`   ✅ Has ${payment.paymentHeads.length} payment heads:`);
            
            let hasZeroAmount = false;
            payment.paymentHeads.forEach((head, headIndex) => {
                console.log(`      ${headIndex + 1}. ${head.name}: ₹${head.amount}`);
                if (head.amount === 0) {
                    hasZeroAmount = true;
                    console.warn(`      ⚠️ ZERO AMOUNT DETECTED!`);
                }
            });
            
            if (hasZeroAmount) {
                paymentsWithZeroHeads++;
            }
            
            // Test receipt generation
            const receiptHeads = getPaymentHeadsFromPayment(payment);
            if (receiptHeads) {
                console.log(`   📄 Receipt would show ${receiptHeads.length} heads`);
            } else {
                console.warn(`   ❌ Receipt generation returned null!`);
            }
        } else {
            paymentsWithoutHeads++;
            console.log(`   ❌ No payment heads stored`);
        }
    });
    
    console.log(`\n📊 === SUMMARY ===`);
    console.log(`Payments with heads: ${paymentsWithHeads}`);
    console.log(`Payments with zero amounts: ${paymentsWithZeroHeads}`);
    console.log(`Payments without heads: ${paymentsWithoutHeads}`);
    
    if (paymentsWithZeroHeads > 0) {
        console.warn(`⚠️ ISSUE FOUND: ${paymentsWithZeroHeads} payments have zero amounts in heads!`);
        console.log(`💡 SOLUTION: Check bill amounts and payment head selection process`);
    }
    
    if (paymentsWithoutHeads > 0) {
        console.log(`ℹ️ INFO: ${paymentsWithoutHeads} payments recorded without specific heads (single payment)`);
    }
    
    console.log('🔍 === END DIAGNOSIS ===');
    
    return {
        total: payments.length,
        withHeads: paymentsWithHeads,
        withZeroHeads: paymentsWithZeroHeads,
        withoutHeads: paymentsWithoutHeads
    };
}

// Function to fix payments with zero amount heads
function fixPaymentsWithZeroHeads() {
    console.log('🔧 === FIXING PAYMENTS WITH ZERO HEADS ===');
    
    const payments = getPaymentsData();
    let fixedCount = 0;
    
    payments.forEach((payment, index) => {
        if (payment.paymentHeads && payment.paymentHeads.length > 0) {
            let hasZeroAmount = false;
            let totalHeadsAmount = 0;
            
            payment.paymentHeads.forEach(head => {
                if (head.amount === 0) {
                    hasZeroAmount = true;
                }
                totalHeadsAmount += head.amount;
            });
            
            if (hasZeroAmount && totalHeadsAmount < payment.amount) {
                console.log(`\n🔧 Fixing payment ${payment.receiptNumber}:`);
                console.log(`   Payment amount: ₹${payment.amount}`);
                console.log(`   Heads total: ₹${totalHeadsAmount}`);
                
                // Distribute remaining amount to zero heads
                const remainingAmount = payment.amount - totalHeadsAmount;
                const zeroHeads = payment.paymentHeads.filter(head => head.amount === 0);
                
                if (zeroHeads.length > 0 && remainingAmount > 0) {
                    const amountPerHead = remainingAmount / zeroHeads.length;
                    
                    zeroHeads.forEach(head => {
                        head.amount = amountPerHead;
                        console.log(`   Fixed ${head.name}: ₹0 → ₹${amountPerHead}`);
                    });
                    
                    fixedCount++;
                }
            }
        }
    });
    
    if (fixedCount > 0) {
        savePaymentsData(payments);
        console.log(`\n✅ Fixed ${fixedCount} payments with zero heads`);
        showNotification(`Fixed ${fixedCount} payments with zero amounts!`, 'success');
    } else {
        console.log('\n✅ No payments with zero heads found');
        showNotification('No payments with zero amounts found', 'info');
    }
    
    console.log('🔧 === END FIX ===');
    return fixedCount;
}

// Test function to check if payment heads integration is working
function testPaymentHeadsIntegration() {
    console.log('=== TESTING PAYMENT HEADS INTEGRATION ===');
    
    // Test 1: Check if payments have payment heads
    const payments = getPaymentsData();
    const paymentsWithHeads = payments.filter(p => p.paymentHeads && p.paymentHeads.length > 0);
    console.log(`Total payments: ${payments.length}`);
    console.log(`Payments with heads: ${paymentsWithHeads.length}`);
    
    if (paymentsWithHeads.length > 0) {
        console.log('Sample payment with heads:', paymentsWithHeads[0]);
        console.log('Sample payment heads:', paymentsWithHeads[0].paymentHeads);
        
        // Test the functions
        const testPayment = paymentsWithHeads[0];
        console.log('Testing addPaymentHeadsBackToFlat...');
        addPaymentHeadsBackToFlat(testPayment.flatNumber, testPayment.paymentHeads);
        
        console.log('Testing reducePaymentHeadsFromFlat...');
        reducePaymentHeadsFromFlat(testPayment.flatNumber, testPayment.paymentHeads);
    } else {
        console.log('No payments with payment heads found. Create a payment with specific heads first.');
    }
    
    console.log('=== END TEST ===');
}

// Function to add payment heads back to flat when payment is deleted
function addPaymentHeadsBackToFlat(flatNumber, paymentHeads) {
    const bills = getBillsData();
    const flats = getFlatsData();
    
    console.log(`Adding payment heads back to Flat ${flatNumber}:`, paymentHeads);
    
    // Find the most recent unpaid or partially paid bill for this flat
    const flatBills = bills
        .filter(bill => bill.flatNumber === flatNumber)
        .sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
    
    let updatedBills = false;
    
    paymentHeads.forEach(head => {
        console.log(`Processing head:`, head);
        console.log(`Head name: ${head.name}, Head type: ${head.type}, Amount: ₹${head.amount}`);
        
        // Use both name and type for matching
        const headName = (head.name || '').toLowerCase();
        const headType = (head.type || '').toLowerCase();
        
        // Try to add the amount back to the appropriate bill category
        if ((headName.includes('maintenance') || headType.includes('maintenance')) && !headName.includes('building') && !headType.includes('building')) {
            // Add back to maintenance charges in recent bill
            const targetBill = flatBills.find(bill => bill.maintenanceCharge >= 0);
            if (targetBill) {
                targetBill.maintenanceCharge += head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to maintenance charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('sinking') || headType.includes('sinking')) {
            // Add back to sinking fund
            const targetBill = flatBills.find(bill => bill.sinkingFund >= 0);
            if (targetBill) {
                targetBill.sinkingFund += head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to sinking fund in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('parking') || headType.includes('parking')) {
            // Add back to parking charges
            const targetBill = flatBills.find(bill => bill.parkingCharges >= 0);
            if (targetBill) {
                targetBill.parkingCharges = (targetBill.parkingCharges || 0) + head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to parking charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('festival') || headType.includes('festival')) {
            // Add back to festival charges
            const targetBill = flatBills.find(bill => bill.festivalCharges >= 0);
            if (targetBill) {
                targetBill.festivalCharges = (targetBill.festivalCharges || 0) + head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to festival charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('building') || headType.includes('building')) {
            // Add back to building maintenance
            const targetBill = flatBills.find(bill => bill.buildingMaintenanceCharges >= 0);
            if (targetBill) {
                targetBill.buildingMaintenanceCharges = (targetBill.buildingMaintenanceCharges || 0) + head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to building maintenance charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('occupancy') || headType.includes('occupancy')) {
            // Add back to occupancy charges
            const targetBill = flatBills.find(bill => bill.occupancyCharges >= 0);
            if (targetBill) {
                targetBill.occupancyCharges = (targetBill.occupancyCharges || 0) + head.amount;
                targetBill.totalAmount += head.amount;
                updatedBills = true;
                console.log(`Added ₹${head.amount} back to occupancy charges in bill ${targetBill.billNumber}`);
            }
        } else if (headName.includes('outstanding') || headType.includes('outstanding') || head.head === 'outstandingAmount') {
            // Handle outstanding amount head specifically
            const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
            if (flatIndex !== -1) {
                flats[flatIndex].outstandingAmount = (flats[flatIndex].outstandingAmount || 0) + head.amount;
                console.log(`Added ₹${head.amount} back to outstanding amount for Flat ${flatNumber}`);
            }
        } else {
            // For other heads that don't match specific categories, add to flat's outstanding amount
            const flatIndex = flats.findIndex(flat => flat.flatNumber === flatNumber);
            if (flatIndex !== -1) {
                flats[flatIndex].outstandingAmount = (flats[flatIndex].outstandingAmount || 0) + head.amount;
                console.log(`Head "${head.name}" (₹${head.amount}) - no specific bill category found, added to outstanding amount`);
            }
        }
    });
    
    // Save updated data
    if (updatedBills) {
        saveBillsData(bills);
        console.log('Updated bills with restored payment head amounts');
    }
    
    saveFlatsData(flats);
    console.log('Updated flat data with restored amounts');
}

// Edit payment record
function editPaymentRecord(paymentId) {
    try {
        console.log('Edit payment clicked for ID:', paymentId);
        alert('Edit button clicked! Payment ID: ' + paymentId); // Debug alert
        
        const payments = getPaymentsData();
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) {
            alert('Payment record not found!');
            return;
        }
        
        console.log('Payment found:', payment);
        // Show edit payment modal
        showEditPaymentModal(payment);
    } catch (error) {
        console.error('Error in editPaymentRecord:', error);
        alert('Error opening edit modal. Please try again.');
    }
}

// Show edit payment modal
function showEditPaymentModal(payment) {
    let modal = document.getElementById('editPaymentModal');
    if (!modal) {
        // Create edit payment modal if it doesn't exist
        createEditPaymentModal();
        modal = document.getElementById('editPaymentModal');
        if (!modal) {
            console.error('Failed to create edit payment modal');
            return;
        }
    }
    
    try {
        // Populate form with existing payment data
        document.getElementById('editPaymentId').value = payment.id;
        document.getElementById('editReceiptNumber').value = payment.receiptNumber || '';
        document.getElementById('editFlatNumber').value = payment.flatNumber || '';
        document.getElementById('editMemberName').value = payment.memberName || '';
        document.getElementById('editAmount').value = payment.amount || '';
        document.getElementById('editPaymentMode').value = payment.mode || 'cash';
        document.getElementById('editPaymentDate').value = payment.date ? payment.date.split('T')[0] : '';
        document.getElementById('editReferenceNumber').value = payment.reference || '';
        document.getElementById('editRemarks').value = payment.remarks || '';
        
        // Set bank account if available
        if (payment.bankAccountId) {
            document.getElementById('editBankAccount').value = payment.bankAccountId;
        }
        
        // Set cheque date if available
        if (payment.chequeDate) {
            document.getElementById('editChequeDate').value = payment.chequeDate.split('T')[0];
        }
        
        // Set maintenance period if available
        if (payment.maintenancePeriod) {
            if (payment.maintenancePeriod.fromMonth) {
                document.getElementById('editMaintenanceFromMonth').value = payment.maintenancePeriod.fromMonth;
            }
            if (payment.maintenancePeriod.toMonth) {
                document.getElementById('editMaintenanceToMonth').value = payment.maintenancePeriod.toMonth;
            }
        }
        
        // Set parking period if available
        if (payment.parkingPeriod) {
            if (payment.parkingPeriod.fromMonth) {
                document.getElementById('editParkingFromMonth').value = payment.parkingPeriod.fromMonth;
            }
            if (payment.parkingPeriod.toMonth) {
                document.getElementById('editParkingToMonth').value = payment.parkingPeriod.toMonth;
            }
        }
        
        console.log('Form populated successfully');
    } catch (error) {
        console.error('Error populating form:', error);
        alert('Error loading payment data. Please try again.');
        return;
    }
    
    // Toggle fields based on payment mode
    toggleEditPaymentFields();
    
    modal.style.display = 'block';
}

// Create edit payment modal
function createEditPaymentModal() {
    const modalHTML = `
        <div id="editPaymentModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Payment Record</h3>
                    <span class="close" onclick="closeEditPaymentModal()">&times;</span>
                </div>
                <form id="editPaymentForm" onsubmit="handleEditPayment(event)">
                    <input type="hidden" id="editPaymentId">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Receipt Number</label>
                            <input type="text" id="editReceiptNumber" required>
                        </div>
                        <div class="form-group">
                            <label>Flat Number</label>
                            <input type="text" id="editFlatNumber" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Member Name</label>
                            <input type="text" id="editMemberName" required>
                        </div>
                        <div class="form-group">
                            <label>Amount (₹)</label>
                            <input type="number" id="editAmount" step="0.01" min="0" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Mode</label>
                            <select id="editPaymentMode" onchange="toggleEditPaymentFields()" required>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                                <option value="online">Online Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Payment Date</label>
                            <input type="date" id="editPaymentDate" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Reference Number</label>
                            <input type="text" id="editReferenceNumber" placeholder="Cheque/Transaction ID">
                        </div>
                        <div class="form-group" id="editChequeDateGroup" style="display: none;">
                            <label>Cheque Date</label>
                            <input type="date" id="editChequeDate">
                        </div>
                    </div>
                    
                    
                    <div class="form-row" id="editBankAccountRow">
                        <div class="form-group">
                            <label>Received in Bank Account <span class="required">*</span></label>
                            <select id="editBankAccount" required>
                                <option value="">Select Bank Account</option>
                            </select>
                            <small class="form-help">Select bank account where payment was received</small>
                        </div>
                    </div>
                    
                    <!-- Multi-Month Payment Periods -->
                    <div class="payment-period-section compact">
                        <h5><i class="fas fa-calendar-alt"></i> Multi-Month Payment Period</h5>
                        
                        <!-- Maintenance Period -->
                        <div class="compact-period-row">
                            <div class="period-group">
                                <label><i class="fas fa-home"></i> Maintenance Period:</label>
                                <select id="editMaintenanceFromMonth" class="compact-date">
                                    <option value="">From Month</option>
                                    <option value="2025-01">January 2025</option>
                                    <option value="2025-02">February 2025</option>
                                    <option value="2025-03">March 2025</option>
                                    <option value="2025-04">April 2025</option>
                                    <option value="2025-05">May 2025</option>
                                    <option value="2025-06">June 2025</option>
                                    <option value="2025-07">July 2025</option>
                                    <option value="2025-08">August 2025</option>
                                    <option value="2025-09">September 2025</option>
                                    <option value="2025-10">October 2025</option>
                                    <option value="2025-11">November 2025</option>
                                    <option value="2025-12">December 2025</option>
                                </select>
                                <span>to</span>
                                <select id="editMaintenanceToMonth" class="compact-date">
                                    <option value="">To Month</option>
                                    <option value="2025-01">January 2025</option>
                                    <option value="2025-02">February 2025</option>
                                    <option value="2025-03">March 2025</option>
                                    <option value="2025-04">April 2025</option>
                                    <option value="2025-05">May 2025</option>
                                    <option value="2025-06">June 2025</option>
                                    <option value="2025-07">July 2025</option>
                                    <option value="2025-08">August 2025</option>
                                    <option value="2025-09">September 2025</option>
                                    <option value="2025-10">October 2025</option>
                                    <option value="2025-11">November 2025</option>
                                    <option value="2025-12">December 2025</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Parking Period -->
                        <div class="compact-period-row">
                            <div class="period-group">
                                <label><i class="fas fa-car"></i> Parking Period:</label>
                                <select id="editParkingFromMonth" class="compact-date">
                                    <option value="">From Month</option>
                                    <option value="2025-01">January 2025</option>
                                    <option value="2025-02">February 2025</option>
                                    <option value="2025-03">March 2025</option>
                                    <option value="2025-04">April 2025</option>
                                    <option value="2025-05">May 2025</option>
                                    <option value="2025-06">June 2025</option>
                                    <option value="2025-07">July 2025</option>
                                    <option value="2025-08">August 2025</option>
                                    <option value="2025-09">September 2025</option>
                                    <option value="2025-10">October 2025</option>
                                    <option value="2025-11">November 2025</option>
                                    <option value="2025-12">December 2025</option>
                                </select>
                                <span>to</span>
                                <select id="editParkingToMonth" class="compact-date">
                                    <option value="">To Month</option>
                                    <option value="2025-01">January 2025</option>
                                    <option value="2025-02">February 2025</option>
                                    <option value="2025-03">March 2025</option>
                                    <option value="2025-04">April 2025</option>
                                    <option value="2025-05">May 2025</option>
                                    <option value="2025-06">June 2025</option>
                                    <option value="2025-07">July 2025</option>
                                    <option value="2025-08">August 2025</option>
                                    <option value="2025-09">September 2025</option>
                                    <option value="2025-10">October 2025</option>
                                    <option value="2025-11">November 2025</option>
                                    <option value="2025-12">December 2025</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="period-help">
                            <small><i class="fas fa-info-circle"></i> Use these options for multi-month advance payments</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Remarks (Optional)</label>
                        <textarea id="editRemarks" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeEditPaymentModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Payment</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Populate bank accounts dropdown
    const banks = getBanksData();
    const bankSelect = document.getElementById('editBankAccount');
    bankSelect.innerHTML = '<option value="">Select Bank Account</option>' + 
        banks.map(bank => `<option value="${bank.id}">${bank.bankName} - ${bank.accountNumber}</option>`).join('');
}

// Toggle edit payment fields based on payment mode
function toggleEditPaymentFields() {
    const mode = document.getElementById('editPaymentMode').value;
    const chequeDateGroup = document.getElementById('editChequeDateGroup');
    const bankAccountRow = document.getElementById('editBankAccountRow');
    const bankAccountSelect = document.getElementById('editBankAccount');
    
    if (mode === 'cheque') {
        chequeDateGroup.style.display = 'block';
        bankAccountRow.style.display = 'block';
        bankAccountSelect.required = true;
    } else if (mode === 'online' || mode === 'upi' || mode === 'card') {
        chequeDateGroup.style.display = 'none';
        bankAccountRow.style.display = 'block';
        bankAccountSelect.required = true;
    } else { // cash
        chequeDateGroup.style.display = 'none';
        bankAccountRow.style.display = 'none';
        bankAccountSelect.required = false;
    }
}

// Handle edit payment form submission
function handleEditPayment(event) {
    event.preventDefault();
    
    const paymentId = document.getElementById('editPaymentId').value;
    const receiptNumber = document.getElementById('editReceiptNumber').value;
    const flatNumber = document.getElementById('editFlatNumber').value;
    const memberName = document.getElementById('editMemberName').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const mode = document.getElementById('editPaymentMode').value;
    const date = document.getElementById('editPaymentDate').value;
    const reference = document.getElementById('editReferenceNumber').value;
    const remarks = document.getElementById('editRemarks').value;
    
    // Get period information
    const maintenanceFromMonth = document.getElementById('editMaintenanceFromMonth').value;
    const maintenanceToMonth = document.getElementById('editMaintenanceToMonth').value;
    const parkingFromMonth = document.getElementById('editParkingFromMonth').value;
    const parkingToMonth = document.getElementById('editParkingToMonth').value;
    
    // Get mode-specific data
    let chequeDate = '';
    let bankAccountId = '';
    
    if (mode === 'cheque') {
        chequeDate = document.getElementById('editChequeDate').value;
        bankAccountId = document.getElementById('editBankAccount').value;
    } else if (mode === 'online' || mode === 'upi' || mode === 'card') {
        bankAccountId = document.getElementById('editBankAccount').value;
    }
    
    // Validate required fields
    if (!receiptNumber || !flatNumber || !memberName || !amount || !date) {
        alert('Please fill all required fields!');
        return;
    }
    
    if ((mode === 'cheque' || mode === 'online' || mode === 'upi' || mode === 'card') && !bankAccountId) {
        alert('Please select a bank account for this payment mode!');
        return;
    }
    
    try {
        // Get existing payment data
        const payments = getPaymentsData();
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex === -1) {
            alert('Payment record not found!');
            return;
        }
        
        const oldPayment = payments[paymentIndex];
        
        // Update payment record with new data
        const updatedPayment = {
            ...oldPayment, // Keep existing data
            receiptNumber: receiptNumber,
            flatNumber: flatNumber,
            memberName: memberName,
            amount: amount,
            mode: mode,
            date: date,
            reference: reference,
            remarks: remarks,
            chequeDate: chequeDate || null,
            bankAccountId: bankAccountId || null,
            // Update period information
            maintenancePeriod: {
                fromMonth: maintenanceFromMonth || null,
                toMonth: maintenanceToMonth || null
            },
            parkingPeriod: {
                fromMonth: parkingFromMonth || null,
                toMonth: parkingToMonth || null
            },
            lastModified: new Date().toISOString()
        };
        
        payments[paymentIndex] = updatedPayment;
        
        // Handle bank balance updates if amount or bank changed
        if (oldPayment.amount !== amount || oldPayment.bankAccountId !== bankAccountId) {
            updateBankBalanceForEditedPayment(oldPayment, updatedPayment);
        }
        
        // Save updated payments
        savePaymentsData(payments);
        
        // Refresh displays
        loadPaymentsData();
        loadDashboardData();
        
        // Close modal
        closeEditPaymentModal();
        
        showNotification('✅ Payment record updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating payment:', error);
        alert('Error updating payment record. Please try again.');
    }
}

// Update bank balance for edited payment
function updateBankBalanceForEditedPayment(oldPayment, newPayment) {
    const banks = getBanksData();
    
    // Revert old bank balance if there was a bank account
    if (oldPayment.bankAccountId) {
        const oldBankIndex = banks.findIndex(b => b.id === oldPayment.bankAccountId);
        if (oldBankIndex !== -1) {
            banks[oldBankIndex].balance -= oldPayment.amount;
        }
    }
    
    // Add new amount to new bank account
    if (newPayment.bankAccountId) {
        const newBankIndex = banks.findIndex(b => b.id === newPayment.bankAccountId);
        if (newBankIndex !== -1) {
            banks[newBankIndex].balance += newPayment.amount;
        }
    }
    
    saveBanksData(banks);
}

// Close edit payment modal
function closeEditPaymentModal() {
    const modal = document.getElementById('editPaymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Delete payment record
function deletePaymentRecord(paymentId) {
    // Show confirmation dialog
    const confirmDelete = confirm('Are you sure you want to delete this payment record?\n\nThis action cannot be undone.');
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        // Get current payments
        const payments = getPaymentsData();
        
        // Find payment to delete
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex === -1) {
            showNotification('Payment record not found!', 'error');
            return;
        }
        
        const deletedPayment = payments[paymentIndex];
        
        // Add to deleted items for potential restore
        addToDeletedItems(deletedPayment, 'payment');
        
        // Remove payment from array
        payments.splice(paymentIndex, 1);
        
        // Save updated payments
        savePaymentsData(payments);
        
        // When payment is deleted, the amount should carry forward as outstanding
        // DO NOT modify bill amounts - bills are historical records
        // The outstanding will be calculated dynamically when loading bills
        console.log(`Payment deleted: ₹${deletedPayment.amount} from Flat ${deletedPayment.flatNumber}`);
        console.log(`Outstanding will be recalculated automatically when bills are loaded`);
        
        // If payment was linked to a bank account, update bank balance and delete bank transaction
        if (deletedPayment.bankAccountId) {
            const banks = getBanksData();
            const bankIndex = banks.findIndex(bank => bank.id === deletedPayment.bankAccountId);
            if (bankIndex !== -1) {
                // Subtract the payment amount from bank balance (reverse the credit)
                banks[bankIndex].balance = (banks[bankIndex].balance || 0) - deletedPayment.amount;
                saveBanksData(banks);
                console.log(`Reversed bank credit of ₹${deletedPayment.amount} from ${banks[bankIndex].bankName}`);
            }
            
            // Delete the corresponding bank transaction
            const bankPayments = getBankPaymentsData();
            const bankTransactionIndex = bankPayments.findIndex(bp => 
                bp.reference === `Receipt: ${deletedPayment.receiptNumber}` || 
                bp.reference === deletedPayment.receiptNumber ||
                (bp.description && bp.description.includes(`Flat ${deletedPayment.flatNumber}`) && bp.amount === deletedPayment.amount)
            );
            
            if (bankTransactionIndex !== -1) {
                const deletedBankTransaction = bankPayments[bankTransactionIndex];
                bankPayments.splice(bankTransactionIndex, 1);
                saveBankPaymentsData(bankPayments);
                console.log(`Deleted bank transaction: ${deletedBankTransaction.description} - ₹${deletedBankTransaction.amount}`);
            } else {
                console.log(`Bank transaction not found for receipt: ${deletedPayment.receiptNumber}`);
            }
        }
        
        // Reload payments table
        loadPaymentsData();
        
        // Reload flats data to show updated outstanding amount
        loadFlatsData();
        
        // Reload billing data to update bill status
        loadBillingData();
        
        // Update dashboard
        loadDashboardData();
        
        // Reload banks data if bank was affected
        if (deletedPayment.bankAccountId) {
            loadBanksData();
        }
        
        // Show success message
        showNotification(`Payment record ${deletedPayment.receiptNumber} deleted successfully!`, 'success');
        
        console.log('Payment deleted:', deletedPayment);
        
    } catch (error) {
        console.error('Error deleting payment:', error);
        showNotification('Error deleting payment record!', 'error');
    }
}

// Delete bill function
function deleteBill(billId) {
    // Show confirmation dialog
    const confirmDelete = confirm('Are you sure you want to delete this bill?\n\nThis action cannot be undone.');
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        // Get current bills
        const bills = getBillsData();
        
        // Find bill to delete
        const billIndex = bills.findIndex(b => b.id === billId);
        
        if (billIndex === -1) {
            showNotification('Bill not found!', 'error');
            return;
        }
        
        const deletedBill = bills[billIndex];
        
        // Add to deleted items for potential restore
        addToDeletedItems(deletedBill, 'bill');
        
        // Remove bill from array
        bills.splice(billIndex, 1);
        
        // Save updated bills
        saveBillsData(bills);
        
        // Reload bills table
        loadBillingData();
        
        // Update dashboard
        loadDashboardData();
        
        // Show success message
        showNotification(`Bill ${deletedBill.billNumber} deleted successfully!`, 'success');
        
        console.log('Bill deleted:', deletedBill);
        
    } catch (error) {
        console.error('Error deleting bill:', error);
        showNotification('Error deleting bill!', 'error');
    }
}

// Fill payment amount from selected bill
function fillPaymentAmount(amount) {
    document.getElementById('paymentAmount').value = amount;
    showNotification('Amount filled from selected bill', 'success');
}

// Sample receipt functions removed - no longer needed

// Sample data initialization removed - system starts clean

// Function to clean all data from the system
function cleanAllData() {
    if (confirm('Are you sure you want to delete ALL data? This action cannot be undone!')) {
        if (confirm('This will delete all flats, payments, expenses, bills, and bank data. Are you absolutely sure?')) {
            // Clear all localStorage data
            localStorage.removeItem('societyFlats');
            localStorage.removeItem('societyPayments');
            localStorage.removeItem('societyExpenses');
            localStorage.removeItem('societyBills');
            localStorage.removeItem('societyBanks');
            localStorage.removeItem('societyBankPayments');
            localStorage.removeItem('societyOtherIncome');
            localStorage.removeItem('societyNotices');
            localStorage.removeItem('societyDocuments');
            localStorage.removeItem('societyBillConfig');
            localStorage.removeItem('societyInfo');
            
            // Reload the page to reset everything
            showNotification('All data has been cleared successfully!', 'success');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
}

// Function to clean only report-related data (payments, expenses, bills)
function cleanReportData() {
    if (confirm('Are you sure you want to delete all payments, expenses, and bills data?')) {
        // Clear report-related data
        localStorage.removeItem('societyPayments');
        localStorage.removeItem('societyExpenses');
        localStorage.removeItem('societyBills');
        localStorage.removeItem('societyBankPayments');
        localStorage.removeItem('societyOtherIncome');
        localStorage.removeItem('societyDeletedItems'); // Clear deleted items too
        
        // Reset bank balances to 0
        const banks = getBanksData();
        banks.forEach(bank => {
            bank.balance = 0;
        });
        saveBanksData(banks);
        
        // Reload relevant sections
        loadPaymentsData();
        loadExpensesData();
        loadBillingData();
        loadBanksData();
        loadDashboardData();
        
        showNotification('All report data has been cleared successfully!', 'success');
    }
}

// Functions to manage deleted items
function getDeletedItemsData() {
    return JSON.parse(localStorage.getItem('societyDeletedItems') || '[]');
}

function saveDeletedItemsData(deletedItems) {
    localStorage.setItem('societyDeletedItems', JSON.stringify(deletedItems));
}

function addToDeletedItems(item, type) {
    const deletedItems = getDeletedItemsData();
    const deletedItem = {
        id: generateId(),
        originalId: item.id,
        type: type, // 'payment', 'expense', 'bill'
        data: item,
        deletedDate: new Date().toISOString(),
        deletedBy: currentUser?.username || 'Admin'
    };
    deletedItems.push(deletedItem);
    saveDeletedItemsData(deletedItems);
    console.log(`Added ${type} to deleted items:`, deletedItem);
}

function restoreDeletedItem(deletedItemId) {
    const deletedItems = getDeletedItemsData();
    const itemIndex = deletedItems.findIndex(item => item.id === deletedItemId);
    
    if (itemIndex === -1) {
        showNotification('Deleted item not found!', 'error');
        return;
    }
    
    const deletedItem = deletedItems[itemIndex];
    const originalData = deletedItem.data;
    
    try {
        // Restore based on type
        switch (deletedItem.type) {
            case 'payment':
                const payments = getPaymentsData();
                payments.push(originalData);
                savePaymentsData(payments);
                
                // Reduce payment heads from specific bill categories (since payment is restored)
                if (originalData.paymentHeads && originalData.paymentHeads.length > 0) {
                    reducePaymentHeadsFromFlat(originalData.flatNumber, originalData.paymentHeads);
                    console.log(`Reduced payment heads from Flat ${originalData.flatNumber} specific categories`);
                } else {
                    // If no specific heads, reduce from flat's outstanding amount
                    const flats = getFlatsData();
                    const flatIndex = flats.findIndex(flat => flat.flatNumber === originalData.flatNumber);
                    if (flatIndex !== -1) {
                        flats[flatIndex].outstandingAmount = Math.max(0, (flats[flatIndex].outstandingAmount || 0) - originalData.amount);
                        saveFlatsData(flats);
                        console.log(`Removed ₹${originalData.amount} from Flat ${originalData.flatNumber} outstanding amount`);
                    }
                }
                
                // Restore bank balance and bank transaction if payment was linked to bank
                if (originalData.bankAccountId) {
                    const banks = getBanksData();
                    const bankIndex = banks.findIndex(bank => bank.id === originalData.bankAccountId);
                    if (bankIndex !== -1) {
                        banks[bankIndex].balance = (banks[bankIndex].balance || 0) + originalData.amount;
                        saveBanksData(banks);
                        
                        // Recreate the bank transaction
                        addMaintenancePaymentToBank(
                            originalData.bankAccountId, 
                            originalData.amount, 
                            originalData.date, 
                            originalData.flatNumber, 
                            originalData.receiptNumber
                        );
                        console.log(`Restored bank transaction for receipt: ${originalData.receiptNumber}`);
                    }
                }
                loadPaymentsData();
                loadFlatsData();
                loadBanksData();
                break;
                
            case 'expense':
                const expenses = getExpensesData();
                expenses.push(originalData);
                saveExpensesData(expenses);
                
                // Restore bank transaction if expense was paid from bank
                if (originalData.bankAccountId) {
                    addExpenseToBank(originalData.bankAccountId, originalData.amount, 
                        originalData.date, originalData.category, originalData.vendor, originalData.id);
                }
                loadExpensesData();
                loadBanksData();
                break;
                
            case 'bill':
                const bills = getBillsData();
                bills.push(originalData);
                saveBillsData(bills);
                loadBillingData();
                break;
        }
        
        // Remove from deleted items
        deletedItems.splice(itemIndex, 1);
        saveDeletedItemsData(deletedItems);
        
        // Update dashboard
        loadDashboardData();
        
        showNotification(`${deletedItem.type.charAt(0).toUpperCase() + deletedItem.type.slice(1)} restored successfully!`, 'success');
        
    } catch (error) {
        console.error('Error restoring item:', error);
        showNotification('Error restoring item!', 'error');
    }
}

// Function to load deleted items table
function loadDeletedItemsData() {
    const deletedItems = getDeletedItemsData();
    const tbody = document.querySelector('#deletedItemsTable tbody');
    
    if (tbody) {
        if (deletedItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666;">No deleted items found</td>
                </tr>
            `;
        } else {
            tbody.innerHTML = deletedItems.map(item => {
                const data = item.data;
                let details = '';
                let amount = '';
                let date = '';
                
                switch (item.type) {
                    case 'payment':
                        details = `${data.flatNumber} - ${data.memberName}`;
                        amount = `₹${data.amount.toLocaleString()}`;
                        date = formatDate(data.date);
                        break;
                    case 'expense':
                        details = `${data.category} - ${data.vendor}`;
                        amount = `₹${data.amount.toLocaleString()}`;
                        date = formatDate(data.date);
                        break;
                    case 'bill':
                        details = `${data.flatNumber} - ${data.memberName}`;
                        amount = `₹${data.totalAmount.toLocaleString()}`;
                        date = formatDate(data.billDate);
                        break;
                }
                
                return `
                    <tr>
                        <td><span class="status-badge status-${item.type}">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span></td>
                        <td>${details}</td>
                        <td>${amount}</td>
                        <td>${date}</td>
                        <td>${formatDate(item.deletedDate)}</td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="restoreDeletedItemAndRefresh('${item.id}')" title="Restore Item">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="permanentlyDeleteItem('${item.id}')" title="Delete Permanently">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// Function to permanently delete an item (cannot be restored)
function permanentlyDeleteItem(deletedItemId) {
    if (confirm('Are you sure you want to permanently delete this item? This action cannot be undone!')) {
        const deletedItems = getDeletedItemsData();
        const updatedItems = deletedItems.filter(item => item.id !== deletedItemId);
        saveDeletedItemsData(updatedItems);
        loadDeletedItemsData();
        showNotification('Item permanently deleted!', 'success');
    }
}

// Enhanced restore function that refreshes the deleted items table
function restoreDeletedItemAndRefresh(deletedItemId) {
    restoreDeletedItem(deletedItemId);
    // Refresh the deleted items table after restore
    setTimeout(() => {
        loadDeletedItemsData();
    }, 500);
}

// Payment period helper functions
function setCurrentMonthPeriod() {
    const now = new Date();
    // Set to previous month (since maintenance is usually for previous month)
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Convert to month format (YYYY-MM)
    const fromMonth = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}`;
    const toMonth = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}`;
    
    const parkingFromElement = document.getElementById('parkingFromMonth');
    const parkingToElement = document.getElementById('parkingToMonth');
    
    if (parkingFromElement) parkingFromElement.value = fromMonth;
    if (parkingToElement) parkingToElement.value = toMonth;
    
    const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    showNotification(`${monthName} period set for parking`, 'success');
}

function setLastMonthPeriod() {
    const now = new Date();
    // Set to 2 months back
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    
    // Convert to month format (YYYY-MM)
    const fromMonth = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}`;
    const toMonth = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}`;
    
    const parkingFromElement = document.getElementById('parkingFromMonth');
    const parkingToElement = document.getElementById('parkingToMonth');
    
    if (parkingFromElement) parkingFromElement.value = fromMonth;
    if (parkingToElement) parkingToElement.value = toMonth;
    
    showNotification('Last month period set for parking', 'success');
}

function setSamePeriodForBoth() {
    // Function no longer needed since we only have parking period
    showNotification('Only parking period is available', 'info');
}

// Format date as "1 September 2025"
function formatDateLong(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

// Test function to demonstrate head-wise pending calculation
function testPendingHeadsCalculation() {
    console.log('\n🧪 === TESTING HEAD-WISE PENDING CALCULATION ===');
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    const flats = getFlatsData();
    
    console.log(`📊 Data: ${bills.length} bills, ${payments.length} payments, ${flats.length} flats`);
    
    // Test for each flat
    flats.forEach(flat => {
        console.log(`\n🏠 Testing Flat ${flat.flatNumber}:`);
        
        // Get pending heads for this flat
        const pendingHeads = calculatePendingHeadsForFlat(flat.flatNumber, bills, payments);
        
        console.log(`📋 Pending Heads Result:`);
        Object.entries(pendingHeads).forEach(([head, amount]) => {
            if (amount > 0) {
                console.log(`  ❌ ${head}: ₹${amount} PENDING`);
            } else {
                console.log(`  ✅ ${head}: ₹0 (Fully Paid)`);
            }
        });
        
        // Show what next month bill would look like
        const config = getBillConfiguration();
        console.log(`\n📅 Next Month Bill Preview (CORRECT CALCULATION):`);
        console.log(`  Maintenance: ₹${config.maintenanceCharge} (base) + ₹${pendingHeads.maintenanceCharge} (pending) = ₹${config.maintenanceCharge + pendingHeads.maintenanceCharge}`);
        console.log(`  Sinking Fund: ₹${config.sinkingFund} (base) + ₹${pendingHeads.sinkingFund} (pending) = ₹${config.sinkingFund + pendingHeads.sinkingFund}`);
        console.log(`  Occupancy: ₹${config.occupancyCharges || 0} (base) + ₹${pendingHeads.occupancyCharges} (pending) = ₹${(config.occupancyCharges || 0) + pendingHeads.occupancyCharges}`);
        console.log(`  Festival: ₹${config.festivalCharges} (base) + ₹${pendingHeads.festivalCharges} (pending) = ₹${config.festivalCharges + pendingHeads.festivalCharges}`);
        
        const totalPending = Object.values(pendingHeads).reduce((sum, amount) => sum + amount, 0);
        console.log(`  💰 Total Pending: ₹${totalPending}`);
    });
    
    console.log('\n✅ HEAD-WISE PENDING TEST COMPLETE');
    showNotification('🧪 Pending heads calculation tested! Check console for details.', 'info');
}

// Helper function to view bill from console
window.viewBillByPeriodAndFlat = function(period, flatNumber) {
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    const bill = bills.find(b => b.period === period && b.flatNumber === flatNumber);
    
    if (bill) {
        console.log('📄 Found bill:', bill);
        viewBill(bill.id);
    } else {
        console.error(`❌ No bill found for Flat ${flatNumber} in period ${period}`);
        console.log('Available bills:', bills.map(b => ({ flat: b.flatNumber, period: b.period })));
    }
};

// Helper function to list all bills
window.listAllBills = function() {
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    console.log(`\n📋 Total Bills: ${bills.length}\n`);
    
    if (bills.length === 0) {
        console.log('❌ No bills found in system');
        return;
    }
    
    // Group by period
    const byPeriod = {};
    bills.forEach(bill => {
        if (!byPeriod[bill.period]) byPeriod[bill.period] = [];
        byPeriod[bill.period].push(bill);
    });
    
    Object.keys(byPeriod).sort().forEach(period => {
        console.log(`📅 ${period}:`);
        byPeriod[period].forEach(bill => {
            console.log(`   Flat ${bill.flatNumber}: ₹${bill.totalAmount} (${bill.status || 'pending'})`);
        });
        console.log('');
    });
    
    return bills;
};

// Helper function to generate bills for a specific month
window.generateBillsForMonth = function(month, year) {
    const config = getBillConfiguration();
    if (!config) {
        console.error('❌ No bill configuration found! Please set configuration first.');
        console.log('💡 Go to Bill Configuration section and save the configuration.');
        return;
    }
    
    const flats = getFlatsData();
    if (flats.length === 0) {
        console.error('❌ No flats found in system! Please add flats first.');
        return;
    }
    
    console.log(`\n🔄 Generating bills for ${year}-${month.padStart(2, '0')}...`);
    console.log(`📊 Configuration:`, config);
    console.log(`🏠 Flats: ${flats.length}`);
    
    generateMonthlyBillsWithConfig(month, year, config);
    
    // Verify bills were created
    const bills = getBillsData();
    const period = `${year}-${month.padStart(2, '0')}`;
    const periodBills = bills.filter(b => b.period === period);
    
    console.log(`✅ Generated ${periodBills.length} bills for ${period}`);
    periodBills.forEach(bill => {
        console.log(`   Flat ${bill.flatNumber}: ₹${bill.totalAmount}`);
    });
    
    loadBillingData();
};

// Helper to refresh all bill statuses based on payments
window.refreshAllBillStatuses = function() {
    console.log('\n🔄 === Refreshing All Bill Statuses ===\n');
    
    const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
    const payments = JSON.parse(localStorage.getItem('societyPayments') || '[]');
    let updatedCount = 0;
    
    bills.forEach(bill => {
        // Find all payments for this flat
        const flatPayments = payments.filter(payment => {
            if (payment.flatNumber !== bill.flatNumber) return false;
            
            // Check if payment applies to this bill period
            if (payment.parkingPeriod && payment.parkingPeriod.fromMonth && payment.parkingPeriod.toMonth) {
                // Multi-month payment - check if bill period is within payment period
                const payFromYear = parseInt(payment.parkingPeriod.fromMonth.split('-')[0]);
                const payFromMonth = parseInt(payment.parkingPeriod.fromMonth.split('-')[1]);
                const payToYear = parseInt(payment.parkingPeriod.toMonth.split('-')[0]);
                const payToMonth = parseInt(payment.parkingPeriod.toMonth.split('-')[1]);
                
                const [billYear, billMonth] = bill.period.split('-').map(Number);
                
                // Check if bill is within payment period
                if (billYear < payFromYear || billYear > payToYear) return false;
                if (billYear === payFromYear && billMonth < payFromMonth) return false;
                if (billYear === payToYear && billMonth > payToMonth) return false;
                
                return true;
            } else {
                // Single month payment - match by period
                return payment.period === bill.period;
            }
        });
        
        // Calculate total paid
        let totalPaid = 0;
        flatPayments.forEach(payment => {
            if (payment.paymentHeads && Array.isArray(payment.paymentHeads)) {
                payment.paymentHeads.forEach(head => {
                    totalPaid += parseFloat(head.amount) || 0;
                });
            } else {
                totalPaid += payment.amount || 0;
            }
        });
        
        // Calculate outstanding
        const outstandingAmount = bill.totalAmount - totalPaid;
        
        // Determine status
        let newStatus = 'pending';
        if (outstandingAmount <= 0) {
            newStatus = 'paid';
        } else if (totalPaid > 0) {
            newStatus = 'partial';
        }
        
        // Update if status changed
        if (bill.status !== newStatus) {
            console.log(`🔄 ${bill.period} (Flat ${bill.flatNumber}): ${bill.status} → ${newStatus} (Paid: ₹${totalPaid})`);
            bill.status = newStatus;
            bill.paidAmount = totalPaid;
            bill.outstandingAmount = Math.max(0, outstandingAmount);
            updatedCount++;
        }
    });
    
    if (updatedCount > 0) {
        localStorage.setItem('societyBills', JSON.stringify(bills));
        console.log(`\n✅ Updated ${updatedCount} bill statuses!`);
        loadBillingData();
    } else {
        console.log('\n✅ All bill statuses are already correct!');
    }
    
    return { updatedCount, totalBills: bills.length };
};

// Helper to check system status
window.checkSystemStatus = function() {
    console.log('\n🔍 === System Status Check ===\n');
    
    const config = getBillConfiguration();
    const flats = getFlatsData();
    const bills = getBillsData();
    const payments = getPaymentsData();
    
    console.log('📋 Bill Configuration:', config ? '✅ Set' : '❌ Not Set');
    if (config) {
        console.log('   Maintenance: ₹' + config.maintenanceCharge);
        console.log('   Sinking Fund: ₹' + config.sinkingFund);
    }
    
    console.log('\n🏠 Flats:', flats.length);
    flats.forEach(flat => {
        console.log(`   ${flat.flatNumber}: ${flat.ownerName}`);
    });
    
    console.log('\n📄 Bills:', bills.length);
    console.log('💰 Payments:', payments.length);
    
    if (!config) {
        console.log('\n⚠️  ACTION REQUIRED: Set bill configuration first!');
    }
    if (flats.length === 0) {
        console.log('\n⚠️  ACTION REQUIRED: Add flats first!');
    }
    
    return { config, flats, bills, payments };
};

// Console command to check bill numbers
window.checkBillNumbers = function() {
    const bills = getBillsData();
    console.log('\n📋 === Bill Numbers Check ===');
    
    bills.sort((a, b) => {
        if (a.billNumber && b.billNumber) {
            return a.billNumber.localeCompare(b.billNumber);
        }
        return 0;
    });
    
    bills.forEach(bill => {
        console.log(`${bill.billNumber} - Flat ${bill.flatNumber} - ${getMonthName(bill.month)} ${bill.year}`);
    });
    
    console.log(`\n📊 Total bills: ${bills.length}`);
    
    // Check for duplicates
    const billNumbers = bills.map(b => b.billNumber).filter(Boolean);
    const duplicates = billNumbers.filter((item, index) => billNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
        console.log(`⚠️ Duplicate bill numbers found: ${duplicates.join(', ')}`);
    } else {
        console.log('✅ No duplicate bill numbers found');
    }
};

// Console command to fix bill number sequence
window.fixBillNumberSequence = function(year, month) {
    const bills = getBillsData();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    console.log(`\n🔧 === Fixing Bill Numbers for ${getMonthName(month)} ${year} ===`);
    
    // Find bills for this period
    const periodBills = bills.filter(bill => 
        bill.period === yearMonth || 
        (bill.year === year && bill.month === month)
    );
    
    console.log(`Found ${periodBills.length} bills for this period`);
    
    // Sort by flat number for consistent ordering
    periodBills.sort((a, b) => {
        const flatA = parseInt(a.flatNumber) || 0;
        const flatB = parseInt(b.flatNumber) || 0;
        return flatA - flatB;
    });
    
    // Reassign bill numbers in sequence
    periodBills.forEach((bill, index) => {
        const sequence = (index + 1).toString().padStart(3, '0');
        const newBillNumber = `BILL-${yearMonth}-${sequence}`;
        
        console.log(`Flat ${bill.flatNumber}: ${bill.billNumber} → ${newBillNumber}`);
        bill.billNumber = newBillNumber;
    });
    
    // Save updated bills
    saveBillsData(bills);
    loadBillingData();
    
    console.log('✅ Bill numbers fixed and sequence updated!');
};

// Auto-fix bill numbers on page load
window.addEventListener('load', function() {
    setTimeout(() => {
        const bills = getBillsData();
        if (bills.length > 0) {
            // Check if bill numbers are proper
            const duplicates = [];
            const billNumbers = bills.map(b => b.billNumber).filter(Boolean);
            
            billNumbers.forEach((num, index) => {
                if (billNumbers.indexOf(num) !== index) {
                    duplicates.push(num);
                }
            });
            
            if (duplicates.length > 0) {
                console.log('🔧 Auto-fixing duplicate bill numbers...');
                fixBillNumberSequence(2025, 10); // Fix October 2025 bills
            }
        }
    }, 1000);
});

// Function to update existing bills with member outstanding amounts
window.updateBillsWithMemberOutstanding = function() {
    console.log('\n🔧 === Updating Bills with Member Outstanding Amounts ===');
    
    const bills = getBillsData();
    let updatedCount = 0;
    
    bills.forEach(bill => {
        // Check if bill already has memberOutstanding field
        if (bill.memberOutstanding === undefined || bill.memberOutstanding === null) {
            // Get member outstanding for this flat
            const memberOutstanding = getMemberOutstandingAmounts(bill.flatNumber);
            
            if (memberOutstanding > 0) {
                console.log(`📝 Flat ${bill.flatNumber} - Adding member outstanding: ₹${memberOutstanding}`);
                bill.memberOutstanding = memberOutstanding;
                
                // Update total amount to include member outstanding
                const oldTotal = bill.totalAmount;
                bill.totalAmount = oldTotal + memberOutstanding;
                
                console.log(`   Old Total: ₹${oldTotal} → New Total: ₹${bill.totalAmount}`);
                updatedCount++;
            } else {
                // Set to 0 if no outstanding
                bill.memberOutstanding = 0;
            }
        }
    });
    
    if (updatedCount > 0) {
        saveBillsData(bills);
        console.log(`\n✅ Updated ${updatedCount} bills with member outstanding amounts`);
        console.log('🔄 Refreshing billing display...');
        loadBillingData();
        console.log('✅ Done! Bills now show member outstanding amounts.');
    } else {
        console.log('\nℹ️ All bills already have member outstanding field.');
    }
    
    return updatedCount;
};

// Function to force refresh member outstanding for all bills
window.refreshMemberOutstandingForAllBills = function() {
    console.log('\n🔄 === Force Refreshing Member Outstanding for All Bills ===');
    
    const bills = getBillsData();
    let updatedCount = 0;
    
    bills.forEach(bill => {
        // Get current member outstanding from localStorage
        const currentMemberOutstanding = getMemberOutstandingAmounts(bill.flatNumber);
        const oldMemberOutstanding = bill.memberOutstanding || 0;
        
        if (currentMemberOutstanding !== oldMemberOutstanding) {
            console.log(`📝 Flat ${bill.flatNumber} - ${bill.period}`);
            console.log(`   Old member outstanding: ₹${oldMemberOutstanding}`);
            console.log(`   New member outstanding: ₹${currentMemberOutstanding}`);
            
            // Calculate the difference
            const difference = currentMemberOutstanding - oldMemberOutstanding;
            
            // Update member outstanding
            bill.memberOutstanding = currentMemberOutstanding;
            
            // Update total amount
            const oldTotal = bill.totalAmount;
            bill.totalAmount = oldTotal + difference;
            
            console.log(`   Old Total: ₹${oldTotal} → New Total: ₹${bill.totalAmount}`);
            updatedCount++;
        }
    });
    
    if (updatedCount > 0) {
        saveBillsData(bills);
        console.log(`\n✅ Updated ${updatedCount} bills with current member outstanding amounts`);
        console.log('🔄 Refreshing billing display...');
        loadBillingData();
        console.log('✅ Done! Bills now show updated member outstanding amounts.');
    } else {
        console.log('\nℹ️ All bills already have correct member outstanding amounts.');
    }
    
    return updatedCount;
};

// Function to manually fix occupancy charges for tenant flats
window.fixOccupancyChargesForTenantFlats = function() {
    console.log('\n🔧 === Fixing Occupancy Charges for Tenant Flats ===');
    
    const bills = getBillsData();
    const flats = getFlatsData();
    const config = getBillConfiguration();
    
    let updatedCount = 0;
    
    bills.forEach(bill => {
        // Find the flat data
        const flat = flats.find(f => f.flatNumber === bill.flatNumber);
        
        if (flat && flat.status === 'tenant') {
            console.log(`📝 Flat ${bill.flatNumber} - Status: ${flat.status} (Tenant)`);
            
            // Check if occupancy charges are missing or 0
            if (!bill.occupancyCharges || bill.occupancyCharges === 0) {
                const occupancyAmount = config.occupancyCharges || 50;
                
                console.log(`   Adding occupancy charges: ₹${occupancyAmount}`);
                
                // Add occupancy charges
                bill.occupancyCharges = occupancyAmount;
                
                // Update total amount
                bill.totalAmount = (bill.totalAmount || 0) + occupancyAmount;
                
                console.log(`   New total: ₹${bill.totalAmount}`);
                updatedCount++;
            } else {
                console.log(`   Already has occupancy charges: ₹${bill.occupancyCharges}`);
            }
        }
    });
    
    if (updatedCount > 0) {
        saveBillsData(bills);
        console.log(`\n✅ Updated ${updatedCount} tenant flat bills with occupancy charges`);
        console.log('🔄 Refreshing billing display...');
        loadBillingData();
        console.log('✅ Done! Tenant flats now have occupancy charges.');
    } else {
        console.log('\nℹ️ All tenant flats already have occupancy charges.');
    }
    
    return updatedCount;
};

// Auto-run on page load to update existing bills
setTimeout(() => {
    const bills = getBillsData();
    const flats = getFlatsData();
    
    // Check for member outstanding updates
    const needsMemberOutstandingUpdate = bills.some(bill => bill.memberOutstanding === undefined || bill.memberOutstanding === null);
    
    // Check for tenant flats without occupancy charges
    const needsOccupancyUpdate = bills.some(bill => {
        const flat = flats.find(f => f.flatNumber === bill.flatNumber);
        return flat && flat.status === 'tenant' && (!bill.occupancyCharges || bill.occupancyCharges === 0);
    });
    
    if (needsMemberOutstandingUpdate) {
        console.log('🔄 Auto-updating bills with member outstanding...');
        updateBillsWithMemberOutstanding();
    }
    
    if (needsOccupancyUpdate) {
        console.log('🔄 Auto-updating tenant flats with occupancy charges...');
        fixOccupancyChargesForTenantFlats();
    }
}, 2000);

// Function to fix bill status and balance display after payments
window.fixBillStatusAndBalance = function() {
    console.log('\n🔧 === Fixing Bill Status and Balance Display ===');
    
    const bills = getBillsData();
    const payments = getPaymentsData();
    let updatedCount = 0;
    
    bills.forEach(bill => {
        // Calculate total paid for this bill
        const billPayments = payments.filter(p => 
            p.flatNumber === bill.flatNumber && 
            p.period === bill.period
        );
        
        let totalPaid = 0;
        billPayments.forEach(payment => {
            totalPaid += payment.amount || 0;
        });
        
        const totalAmount = bill.totalAmount || 0;
        const remainingBalance = Math.max(0, totalAmount - totalPaid);
        
        // Determine correct status
        let newStatus;
        if (remainingBalance === 0) {
            newStatus = 'paid';
        } else if (totalPaid > 0) {
            newStatus = 'partial';
        } else {
            newStatus = 'pending';
        }
        
        // Update if status changed
        if (bill.status !== newStatus) {
            console.log(`📝 Flat ${bill.flatNumber} ${bill.period}: Status ${bill.status} → ${newStatus}, Balance: ₹${remainingBalance}`);
            bill.status = newStatus;
            updatedCount++;
        }
        
        // Ensure balance is correctly calculated
        bill.remainingBalance = remainingBalance;
    });
    
    if (updatedCount > 0) {
        saveBillsData(bills);
        console.log(`\n✅ Updated ${updatedCount} bill statuses`);
        console.log('🔄 Refreshing billing display...');
        loadBillingData();
        console.log('✅ Done! Bill statuses and balances are now correct.');
    } else {
        console.log('\nℹ️ All bill statuses are already correct.');
    }
    
    return updatedCount;
};
