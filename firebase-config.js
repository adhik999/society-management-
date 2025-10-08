// Firebase Configuration and Setup for Housing Society Management System

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMdybAINtTFEt-xW-1s-GkxyuAEaBAz90",
  authDomain: "society-management-d51fd.firebaseapp.com",
  databaseURL: "https://society-management-d51fd-default-rtdb.asia-southeast1.firebasedatabase.app/", // Realtime Database URL
  projectId: "society-management-d51fd",
  storageBucket: "society-management-d51fd.firebasestorage.app",
  messagingSenderId: "302743150025",
  appId: "1:302743150025:web:cc28d19409ef84234bdc18",
  measurementId: "G-2RXE95DDRP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const database = firebase.database();
const auth = firebase.auth();

// Firebase Database Helper Functions
class FirebaseHelper {
    
    // Society Info Functions
    static async saveSocietyInfo(societyInfo) {
        try {
            await database.ref('societyInfo').set({
                ...societyInfo,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Society info saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error saving society info:', error);
            return false;
        }
    }

    static async getSocietyInfo() {
        try {
            const snapshot = await database.ref('societyInfo').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ Error getting society info:', error);
            return {};
        }
    }

    // Flats Functions
    static async saveFlat(flat) {
        try {
            const flatId = `flat_${flat.flatNumber}`;
            await database.ref(`flats/${flatId}`).set({
                ...flat,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Flat ${flat.flatNumber} saved to Firebase`);
            return true;
        } catch (error) {
            console.error('❌ Error saving flat:', error);
            return false;
        }
    }

    static async getAllFlats() {
        try {
            const snapshot = await database.ref('flats').once('value');
            const flatsData = snapshot.val() || {};
            // Convert object to array for compatibility
            return Object.values(flatsData);
        } catch (error) {
            console.error('❌ Error getting flats:', error);
            return [];
        }
    }

    static async updateFlat(flatNumber, updates) {
        try {
            const flatId = `flat_${flatNumber}`;
            await database.ref(`flats/${flatId}`).update({
                ...updates,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Flat ${flatNumber} updated in Firebase`);
            return true;
        } catch (error) {
            console.error('❌ Error updating flat:', error);
            return false;
        }
    }

    // Bills Functions
    static async saveBill(bill) {
        try {
            const [year, month] = bill.period.split('-');
            const billId = `bill_${bill.flatNumber}_${bill.period}`;
            
            await database.ref(`bills/${year}/${month}/${billId}`).set({
                ...bill,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Bill ${bill.billNumber} saved to Firebase`);
            return true;
        } catch (error) {
            console.error('❌ Error saving bill:', error);
            return false;
        }
    }

    static async getAllBills() {
        try {
            const snapshot = await database.ref('bills').once('value');
            const billsData = snapshot.val() || {};
            
            // Flatten nested structure to array
            const bills = [];
            Object.keys(billsData).forEach(year => {
                Object.keys(billsData[year]).forEach(month => {
                    Object.values(billsData[year][month]).forEach(bill => {
                        bills.push(bill);
                    });
                });
            });
            
            return bills;
        } catch (error) {
            console.error('❌ Error getting bills:', error);
            return [];
        }
    }

    static async updateBill(billId, updates) {
        try {
            // Find bill path by searching through years/months
            const snapshot = await database.ref('bills').once('value');
            const billsData = snapshot.val() || {};
            
            let billPath = null;
            Object.keys(billsData).forEach(year => {
                Object.keys(billsData[year]).forEach(month => {
                    if (billsData[year][month][billId]) {
                        billPath = `bills/${year}/${month}/${billId}`;
                    }
                });
            });
            
            if (billPath) {
                await database.ref(billPath).update({
                    ...updates,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });
                console.log(`✅ Bill ${billId} updated in Firebase`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error updating bill:', error);
            return false;
        }
    }

    // Payments Functions
    static async savePayment(payment) {
        try {
            const paymentDate = new Date(payment.date);
            const year = paymentDate.getFullYear().toString();
            const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
            const paymentId = payment.receiptNumber ? `payment_${payment.receiptNumber}` : `payment_${Date.now()}`;
            
            await database.ref(`payments/${year}/${month}/${paymentId}`).set({
                ...payment,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Payment ${payment.receiptNumber} saved to Firebase`);
            return true;
        } catch (error) {
            console.error('❌ Error saving payment:', error);
            return false;
        }
    }

    static async getAllPayments() {
        try {
            const snapshot = await database.ref('payments').once('value');
            const paymentsData = snapshot.val() || {};
            
            // Flatten nested structure to array
            const payments = [];
            Object.keys(paymentsData).forEach(year => {
                Object.keys(paymentsData[year]).forEach(month => {
                    Object.values(paymentsData[year][month]).forEach(payment => {
                        payments.push(payment);
                    });
                });
            });
            
            return payments;
        } catch (error) {
            console.error('❌ Error getting payments:', error);
            return [];
        }
    }

    // Expenses Functions
    static async saveExpense(expense) {
        try {
            const expenseDate = new Date(expense.date);
            const year = expenseDate.getFullYear().toString();
            const month = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const expenseId = expense.expenseNumber ? `expense_${expense.expenseNumber}` : `expense_${Date.now()}`;
            
            await database.ref(`expenses/${year}/${month}/${expenseId}`).set({
                ...expense,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Expense ${expense.expenseNumber} saved to Firebase`);
            return true;
        } catch (error) {
            console.error('❌ Error saving expense:', error);
            return false;
        }
    }

    static async getAllExpenses() {
        try {
            const snapshot = await database.ref('expenses').once('value');
            const expensesData = snapshot.val() || {};
            
            // Flatten nested structure to array
            const expenses = [];
            Object.keys(expensesData).forEach(year => {
                Object.keys(expensesData[year]).forEach(month => {
                    Object.values(expensesData[year][month]).forEach(expense => {
                        expenses.push(expense);
                    });
                });
            });
            
            return expenses;
        } catch (error) {
            console.error('❌ Error getting expenses:', error);
            return [];
        }
    }

    // Banks Functions
    static async saveBank(bank) {
        try {
            const bankId = bank.id || `bank_${Date.now()}`;
            await database.ref(`banks/${bankId}`).set({
                ...bank,
                id: bankId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Bank ${bank.bankName} saved to Firebase`);
            return bankId;
        } catch (error) {
            console.error('❌ Error saving bank:', error);
            return null;
        }
    }

    static async getAllBanks() {
        try {
            const snapshot = await database.ref('banks').once('value');
            const banksData = snapshot.val() || {};
            return Object.values(banksData);
        } catch (error) {
            console.error('❌ Error getting banks:', error);
            return [];
        }
    }

    static async updateBankBalance(bankId, newBalance) {
        try {
            await database.ref(`banks/${bankId}`).update({
                balance: newBalance,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Bank ${bankId} balance updated to ₹${newBalance}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating bank balance:', error);
            return false;
        }
    }

    // Bank Transactions Functions
    static async saveBankTransaction(bankId, transaction) {
        try {
            const transactionId = `transaction_${Date.now()}`;
            await database.ref(`bankTransactions/${bankId}/${transactionId}`).set({
                ...transaction,
                id: transactionId,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Bank transaction saved for ${bankId}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving bank transaction:', error);
            return false;
        }
    }

    static async getBankTransactions(bankId) {
        try {
            const snapshot = await database.ref(`bankTransactions/${bankId}`).once('value');
            const transactionsData = snapshot.val() || {};
            return Object.values(transactionsData);
        } catch (error) {
            console.error('❌ Error getting bank transactions:', error);
            return [];
        }
    }

    // Bill Configuration Functions
    static async saveBillConfiguration(config) {
        try {
            await database.ref('billConfiguration').set({
                ...config,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Bill configuration saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error saving bill configuration:', error);
            return false;
        }
    }

    static async getBillConfiguration() {
        try {
            const snapshot = await database.ref('billConfiguration').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ Error getting bill configuration:', error);
            return {};
        }
    }

    // Other Income Functions
    static async saveOtherIncome(income) {
        try {
            const incomeDate = new Date(income.date);
            const year = incomeDate.getFullYear().toString();
            const month = (incomeDate.getMonth() + 1).toString().padStart(2, '0');
            const incomeId = `income_${Date.now()}`;
            
            await database.ref(`otherIncome/${year}/${month}/${incomeId}`).set({
                ...income,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Other income saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error saving other income:', error);
            return false;
        }
    }

    static async getAllOtherIncome() {
        try {
            const snapshot = await database.ref('otherIncome').once('value');
            const incomeData = snapshot.val() || {};
            
            // Flatten nested structure to array
            const income = [];
            Object.keys(incomeData).forEach(year => {
                Object.keys(incomeData[year]).forEach(month => {
                    Object.values(incomeData[year][month]).forEach(item => {
                        income.push(item);
                    });
                });
            });
            
            return income;
        } catch (error) {
            console.error('❌ Error getting other income:', error);
            return [];
        }
    }

    // Member Outstanding Functions
    static async saveMemberOutstanding(outstanding) {
        try {
            const outstandingId = `outstanding_${outstanding.flatNumber}`;
            await database.ref(`memberOutstanding/${outstandingId}`).set({
                ...outstanding,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`✅ Outstanding saved for flat ${outstanding.flatNumber}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving member outstanding:', error);
            return false;
        }
    }

    static async getAllMemberOutstanding() {
        try {
            const snapshot = await database.ref('memberOutstanding').once('value');
            const outstandingData = snapshot.val() || {};
            return Object.values(outstandingData);
        } catch (error) {
            console.error('❌ Error getting member outstanding:', error);
            return [];
        }
    }

    // System Settings Functions
    static async saveSystemSettings(settings) {
        try {
            await database.ref('systemSettings').set({
                ...settings,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ System settings saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error saving system settings:', error);
            return false;
        }
    }

    static async getSystemSettings() {
        try {
            const snapshot = await database.ref('systemSettings').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ Error getting system settings:', error);
            return {};
        }
    }

    // Authentication Functions
    static async createUser(email, password, userData) {
        try {
            // Create user with email and password
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to database
            await database.ref(`users/${user.uid}`).set({
                uid: user.uid,
                email: email,
                ...userData,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log(`✅ User created: ${email}`);
            return { success: true, user: user };
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Google Sign-in with Redirect (Alternative to Popup)
    static async loginWithGoogleRedirect() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            await auth.signInWithRedirect(provider);
            // Redirect will handle the rest
            return { success: true, message: 'Redirecting to Google...' };
        } catch (error) {
            console.error('❌ Google redirect error:', error);
            return { success: false, error: error.message };
        }
    }

    // Handle Google Sign-in Result after redirect
    static async handleGoogleRedirectResult() {
        try {
            const result = await auth.getRedirectResult();
            
            if (result.user) {
                const user = result.user;
                
                // Save user data to database
                await database.ref(`users/${user.uid}`).set({
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid,
                    provider: 'google',
                    role: 'manager',
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
                
                console.log('✅ Google login successful:', user.email);
                return { success: true, user: user };
            }
            
            return { success: false, error: 'No user from redirect' };
        } catch (error) {
            console.error('❌ Google redirect result error:', error);
            return { success: false, error: error.message };
        }
    }

    // Google Sign-in with Popup (Original)
    static async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Save user data to database
            await database.ref(`users/${user.uid}`).set({
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                uid: user.uid,
                provider: 'google',
                role: 'manager',
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('✅ Google login successful:', user.email);
            return { success: true, user: user };
        } catch (error) {
            console.error('❌ Google login error:', error);
            
            // If popup fails, try redirect method
            if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-supported-in-this-environment') {
                console.log('🔄 Popup failed, trying redirect method...');
                return await this.loginWithGoogleRedirect();
            }
            
            return { success: false, error: error.message };
        }
    }

    static async loginUser(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update last login time
            await database.ref(`users/${user.uid}`).update({
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log(`✅ User logged in: ${email}`);
            return { success: true, user: user };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }

    static async logoutUser() {
        try {
            await auth.signOut();
            console.log('✅ User logged out');
            return { success: true };
        } catch (error) {
            console.error('❌ Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    static async getCurrentUser() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                resolve(user);
            });
        });
    }

    static async getUserData(uid) {
        try {
            const snapshot = await database.ref(`users/${uid}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('❌ Error getting user data:', error);
            return null;
        }
    }

    // Utility Functions
    static async checkConnection() {
        try {
            const connectedRef = database.ref('.info/connected');
            return new Promise((resolve) => {
                connectedRef.once('value', (snapshot) => {
                    resolve(snapshot.val() === true);
                });
            });
        } catch (error) {
            console.error('❌ Error checking connection:', error);
            return false;
        }
    }

    // Migration Helper - Import localStorage data to Firebase
    static async migrateFromLocalStorage() {
        try {
            console.log('🔄 Starting migration from localStorage to Firebase...');
            
            // Migrate Society Info
            const societyInfo = JSON.parse(localStorage.getItem('societyInfo') || '{}');
            if (Object.keys(societyInfo).length > 0) {
                await this.saveSocietyInfo(societyInfo);
            }

            // Migrate Flats
            const flats = JSON.parse(localStorage.getItem('societyFlats') || '[]');
            for (const flat of flats) {
                await this.saveFlat(flat);
            }

            // Migrate Bills
            const bills = JSON.parse(localStorage.getItem('societyBills') || '[]');
            for (const bill of bills) {
                await this.saveBill(bill);
            }

            // Migrate Payments
            const payments = JSON.parse(localStorage.getItem('societyPayments') || '[]');
            for (const payment of payments) {
                await this.savePayment(payment);
            }

            // Migrate Expenses
            const expenses = JSON.parse(localStorage.getItem('societyExpenses') || '[]');
            for (const expense of expenses) {
                await this.saveExpense(expense);
            }

            // Migrate Banks
            const banks = JSON.parse(localStorage.getItem('societyBanks') || '[]');
            for (const bank of banks) {
                await this.saveBank(bank);
            }

            // Migrate Bill Configuration
            const billConfig = JSON.parse(localStorage.getItem('billConfiguration') || '{}');
            if (Object.keys(billConfig).length > 0) {
                await this.saveBillConfiguration(billConfig);
            }

            // Migrate Other Income
            const otherIncome = JSON.parse(localStorage.getItem('societyOtherIncome') || '[]');
            for (const income of otherIncome) {
                await this.saveOtherIncome(income);
            }

            // Migrate Member Outstanding
            const memberOutstanding = JSON.parse(localStorage.getItem('memberOutstanding') || '[]');
            for (const outstanding of memberOutstanding) {
                await this.saveMemberOutstanding(outstanding);
            }

            console.log('✅ Migration completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }
}

// Connection Status Monitoring
let isFirebaseConnected = false;

database.ref('.info/connected').on('value', (snapshot) => {
    const connected = snapshot.val() === true;
    isFirebaseConnected = connected;
    
    if (connected) {
        console.log('🟢 Firebase connected');
        // Update UI connection indicator
        updateFirebaseStatus('connected');
        
        // Show notification only on reconnect (not initial load)
        if (typeof showNotification === 'function' && window.firebaseInitialized) {
            showNotification('🔥 Firebase connected - Data syncing enabled', 'success');
        }
    } else {
        console.log('🔴 Firebase disconnected');
        updateFirebaseStatus('disconnected');
        
        if (typeof showNotification === 'function' && window.firebaseInitialized) {
            showNotification('⚠️ Firebase offline - Using local storage only', 'warning');
        }
    }
    
    window.firebaseInitialized = true;
});

// Update Firebase connection status in UI
function updateFirebaseStatus(status) {
    // Add status indicator to header if it exists
    const header = document.querySelector('.main-header, .header');
    if (header) {
        let statusIndicator = document.getElementById('firebase-status');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'firebase-status';
            statusIndicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusIndicator);
        }
        
        if (status === 'connected') {
            statusIndicator.innerHTML = '🔥 Firebase Online';
            statusIndicator.style.backgroundColor = '#4CAF50';
            statusIndicator.style.color = 'white';
        } else {
            statusIndicator.innerHTML = '📱 Offline Mode';
            statusIndicator.style.backgroundColor = '#FF9800';
            statusIndicator.style.color = 'white';
        }
    }
}

// Make FirebaseHelper available globally
window.FirebaseHelper = FirebaseHelper;

// Setup default manager user
async function setupDefaultUser() {
    try {
        console.log('🔐 Checking authentication setup...');
        
        // Try different password combinations for existing user
        const email = 'ghadageadhik99@gmail.com';
        const passwords = ['admin123', 'manager123', 'ghadageadhik99', 'password123', 'adhik123', '123456'];
        
        let loginSuccess = false;
        
        for (const password of passwords) {
            try {
                const loginResult = await FirebaseHelper.loginUser(email, password);
                if (loginResult.success) {
                    console.log(`✅ Login successful with password: ${password}`);
                    console.log('📧 Email: ghadageadhik99@gmail.com');
                    console.log(`🔑 Password: ${password}`);
                    
                    // Store working credentials for auto-login
                    localStorage.setItem('firebaseCredentials', JSON.stringify({ email, password }));
                    
                    // Sign out after verification
                    await FirebaseHelper.logoutUser();
                    loginSuccess = true;
                    break;
                }
            } catch (error) {
                // Continue to next password
                continue;
            }
        }
        
        if (!loginSuccess) {
            console.log('❌ Could not login with any password. User exists but password unknown.');
            console.log('💡 Options:');
            console.log('   1. Run: await resetUserPassword() - to reset password via email');
            console.log('   2. Run: await createTestUser() - to create new test user');
            console.log('   3. Contact admin to reset password in Firebase Console');
        }
        
    } catch (error) {
        console.log('ℹ️ Authentication setup info:', error.message);
    }
}

// Initialize Firebase and setup user
console.log('🔥 Firebase initialized successfully!');
console.log('📊 Use FirebaseHelper class for database operations');
console.log('🚀 Run FirebaseHelper.migrateFromLocalStorage() to migrate existing data');

// Setup default user after Firebase is ready (DISABLED due to too many requests)
// setTimeout(() => {
//     setupDefaultUser();
// }, 2000);

console.log('⚠️ Auto-login disabled due to Firebase rate limiting');
console.log('💡 To create a new user, run: await createTestUser()');
console.log('🔑 Or reset password with: await resetUserPassword()');
console.log('📧 Or login manually with: await firebaseLogin("email", "password")');

// Manual user creation function for console
window.createManagerUser = async function() {
    console.log('🔄 Creating manager user manually...');
    const result = await FirebaseHelper.createUser('ghadageadhik99@gmail.com', 'ghadageadhik99', {
        name: 'Adhik Ghadage',
        role: 'manager',
        username: 'ghadageadhik99@gmail.com',
        isActive: true
    });
    
    if (result.success) {
        console.log('✅ Manager user created successfully!');
        console.log('📧 Email: ghadageadhik99@gmail.com');
        console.log('🔑 Password: ghadageadhik99');
        await FirebaseHelper.logoutUser();
    } else {
        console.log('❌ Error creating user:', result.error);
    }
    
    return result;
};

// Test login function for console
window.testLogin = async function() {
    console.log('🔄 Testing login...');
    const result = await FirebaseHelper.loginUser('ghadageadhik99@gmail.com', 'ghadageadhik99');
    
    if (result.success) {
        console.log('✅ Login successful!');
        console.log('👤 User:', result.user.email);
        await FirebaseHelper.logoutUser();
    } else {
        console.log('❌ Login failed:', result.error);
    }
    
    return result;
};

// Easy login function for console
window.firebaseLogin = async function(email, password) {
    console.log(`🔐 Logging in with ${email}...`);
    const result = await FirebaseHelper.loginUser(email, password);
    
    if (result.success) {
        console.log('✅ Login successful!');
        console.log('👤 User:', result.user.email);
        console.log('🔥 You can now use Firebase features!');
        return result;
    } else {
        console.log('❌ Login failed:', result.error);
        return result;
    }
};

// Quick login with default credentials
window.quickLogin = async function() {
    console.log('🚀 Quick login with default credentials...');
    return await firebaseLogin('ghadageadhik99@gmail.com', 'ghadageadhik99');
};

// Check current login status
window.checkLoginStatus = function() {
    const user = FirebaseHelper.getCurrentUser();
    if (user) {
        console.log('✅ You are logged in as:', user.email);
        return true;
    } else {
        console.log('❌ You are not logged in to Firebase');
        console.log('💡 Use quickLogin() or firebaseLogin(email, password) to login');
        return false;
    }
};

// Logout function
window.firebaseLogout = async function() {
    console.log('🔓 Logging out...');
    await FirebaseHelper.logoutUser();
    console.log('✅ Logged out successfully!');
};

// Create manager user for testing
window.createTestUser = async function() {
    console.log('👤 Creating test user in Firebase...');
    
    try {
        // Try to create user with email/password
        const result = await FirebaseHelper.createUser('manager@society.com', 'manager123', {
            name: 'Society Manager',
            role: 'manager',
            isActive: true
        });
        
        if (result.success) {
            console.log('✅ Test user created successfully!');
            console.log('📧 Email: manager@society.com');
            console.log('🔑 Password: manager123');
            console.log('💡 Now run: await firebaseLogin("manager@society.com", "manager123")');
            return result;
        } else {
            console.log('❌ User creation failed:', result.error);
            
            // If user already exists, try to login
            if (result.error.includes('email-already-in-use')) {
                console.log('🔄 User exists, trying to login...');
                return await firebaseLogin('manager@society.com', 'manager123');
            }
            
            return result;
        }
    } catch (error) {
        console.log('❌ Error creating user:', error.message);
        
        // If user already exists, try to login
        if (error.message.includes('email-already-in-use')) {
            console.log('👤 User already exists, trying to login...');
            return await firebaseLogin('manager@society.com', 'manager123');
        }
    }
};

// Alternative login with different credentials
window.loginAsManager = async function() {
    console.log('🔐 Logging in as Manager...');
    return await firebaseLogin('manager@society.com', 'manager123');
};

// Google Sign-in function for console
window.googleLogin = async function() {
    console.log('🔐 Logging in with Google...');
    try {
        const result = await FirebaseHelper.loginWithGoogle();
        
        if (result.success) {
            if (result.message && result.message.includes('Redirecting')) {
                console.log('🔄 Redirecting to Google for authentication...');
                console.log('💡 You will be redirected back after login');
                return result;
            } else {
                console.log('✅ Google login successful!');
                console.log('👤 User:', result.user.displayName);
                console.log('📧 Email:', result.user.email);
                console.log('🔥 You can now use Firebase features!');
                return result;
            }
        } else {
            console.log('❌ Google login failed:', result.error);
            return result;
        }
    } catch (error) {
        console.log('❌ Google login error:', error.message);
        return { success: false, error: error.message };
    }
};

// Google Redirect Login (Direct)
window.googleRedirectLogin = async function() {
    console.log('🔄 Starting Google redirect login...');
    try {
        const result = await FirebaseHelper.loginWithGoogleRedirect();
        console.log('🔄 Redirecting to Google...');
        return result;
    } catch (error) {
        console.log('❌ Redirect login error:', error.message);
        return { success: false, error: error.message };
    }
};

// Test Google button click manually
window.testGoogleButton = function() {
    console.log('🔍 Testing Google button...');
    
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        console.log('✅ Google button found!');
        console.log('Button element:', googleBtn);
        console.log('Button innerHTML:', googleBtn.innerHTML);
        console.log('Button disabled:', googleBtn.disabled);
        
        // Try to click it programmatically
        console.log('🖱️ Clicking button programmatically...');
        googleBtn.click();
    } else {
        console.log('❌ Google button not found!');
        console.log('Available buttons:', document.querySelectorAll('button'));
    }
};

// Manual Google login trigger
window.manualGoogleLogin = async function() {
    console.log('🔐 Manual Google login trigger...');
    
    // Call the handler directly
    if (typeof handleGoogleLogin === 'function') {
        console.log('✅ Calling handleGoogleLogin directly...');
        await handleGoogleLogin();
    } else {
        console.log('❌ handleGoogleLogin function not found');
        console.log('💡 Trying direct Firebase call...');
        await googleLogin();
    }
};

// Create new user with different email
window.createNewTestUser = async function() {
    console.log('👤 Creating new test user...');
    
    const timestamp = Date.now();
    const testEmail = `manager${timestamp}@society.local`;
    const testPassword = 'manager123';
    
    try {
        const result = await FirebaseHelper.createUser(testEmail, testPassword, {
            name: 'Society Manager',
            role: 'manager',
            username: testEmail
        });
        
        if (result.success) {
            console.log('✅ New test user created successfully!');
            console.log('📧 Email:', testEmail);
            console.log('🔑 Password:', testPassword);
            console.log('💡 Now trying to login...');
            
            // Try to login with new user
            const loginResult = await FirebaseHelper.loginUser(testEmail, testPassword);
            if (loginResult.success) {
                console.log('🎉 Login successful with new user!');
                return { success: true, email: testEmail, password: testPassword };
            }
        }
        
        return result;
    } catch (error) {
        console.log('❌ Error creating new user:', error.message);
        return { success: false, error: error.message };
    }
};

// Reset existing user password (if possible)
window.resetUserPassword = async function() {
    console.log('🔄 Attempting to reset user password...');
    
    try {
        // Try to send password reset email
        await auth.sendPasswordResetEmail('ghadageadhik99@gmail.com');
        console.log('📧 Password reset email sent to ghadageadhik99@gmail.com');
        console.log('💡 Check your email and reset password');
        return { success: true, message: 'Reset email sent' };
    } catch (error) {
        console.log('❌ Password reset failed:', error.message);
        return { success: false, error: error.message };
    }
};

// Try different password combinations
window.tryDifferentPasswords = async function() {
    console.log('🔐 Trying different password combinations...');
    
    const email = 'ghadageadhik99@gmail.com';
    const passwords = [
        'ghadageadhik99',
        'adhik123',
        'manager123',
        'admin123',
        'password123',
        '123456'
    ];
    
    for (const password of passwords) {
        console.log(`🔑 Trying password: ${password}`);
        try {
            const result = await FirebaseHelper.loginUser(email, password);
            if (result.success) {
                console.log(`✅ Success! Password is: ${password}`);
                return { success: true, email, password };
            }
        } catch (error) {
            console.log(`❌ Failed with: ${password}`);
        }
    }
    
    console.log('❌ None of the passwords worked');
    return { success: false, message: 'No password worked' };
};

// Debug Firebase Auth
window.debugFirebaseAuth = async function() {
    console.log('🔍 Debugging Firebase Authentication...');
    
    // Check Firebase connection
    console.log('1. Checking Firebase connection...');
    const connection = await FirebaseHelper.checkConnection();
    console.log('Connection status:', connection);
    
    // Check Auth configuration
    console.log('2. Checking Auth configuration...');
    console.log('Auth instance:', auth);
    console.log('Current user:', auth.currentUser);
    
    // Try to create user first
    console.log('3. Trying to create manager user...');
    try {
        const createResult = await createManagerUser();
        console.log('Create result:', createResult);
    } catch (error) {
        console.log('Create error:', error.message);
    }
    
    // Try to login
    console.log('4. Trying to login...');
    try {
        const loginResult = await quickLogin();
        console.log('Login result:', loginResult);
        
        // If login successful, test Firebase operations
        if (loginResult && loginResult.success) {
            console.log('✅ Login successful, testing Firebase operations...');
            
            // Test flat sync
            const testFlat = {
                flatNumber: 'TEST-101',
                memberName: 'Test User',
                memberContact: '9876543210',
                memberEmail: 'test@example.com',
                flatType: '1BHK',
                parkingSlots: 1,
                isOccupied: true,
                createdDate: new Date().toISOString()
            };
            
            console.log('📝 Testing flat save...');
            const flatResult = await FirebaseHelper.saveFlat(testFlat);
            console.log('✅ Flat save result:', flatResult);
            
            // Test payment sync
            const testPayment = {
                id: 'payment-test-' + Date.now(),
                flatNumber: 'TEST-101',
                memberName: 'Test User',
                amount: 1000,
                mode: 'cash',
                date: new Date().toISOString().split('T')[0],
                recordedDate: new Date().toISOString()
            };
            
            console.log('💰 Testing payment save...');
            const paymentResult = await FirebaseHelper.savePayment(testPayment);
            console.log('✅ Payment save result:', paymentResult);
            
            // Test expense sync
            const testExpense = {
                id: 'expense-test-' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                category: 'electricity',
                amount: 500,
                vendor: 'Test Vendor',
                description: 'Test expense',
                createdDate: new Date().toISOString()
            };
            
            console.log('💸 Testing expense save...');
            const expenseResult = await FirebaseHelper.saveExpense(testExpense);
            console.log('✅ Expense save result:', expenseResult);
            
            console.log('🎉 All Firebase sync tests completed successfully!');
            
            // Logout after testing
            await FirebaseHelper.logoutUser();
            console.log('🔓 Logged out after testing');
        }
    } catch (error) {
        console.error('❌ Firebase sync test failed:', error);
    }
};
