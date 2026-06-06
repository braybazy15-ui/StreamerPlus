/**
 * data-manager.js
 * سیستم ذخیره‌سازی چندلایه برای آکادمی پایتون بردیا فاتحی
 * اولویت: localStorage > sessionStorage > cookie
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'python_academy_data';
    
    // ==================== تست سلامت localStorage ====================
    function isLocalStorageAvailable() {
        try {
            const test = '__ls_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==================== تست سلامت sessionStorage ====================
    function isSessionStorageAvailable() {
        try {
            const test = '__ss_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==================== کوکی‌ها ====================
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }

    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // ==================== انتخاب بهترین روش ذخیره‌سازی ====================
    const storageMethod = isLocalStorageAvailable() ? 'localStorage' : 
                          isSessionStorageAvailable() ? 'sessionStorage' : 'cookie';

    console.log('📦 روش ذخیره‌سازی انتخاب شده:', storageMethod);

    // ==================== ذخیره داده ====================
    window.saveData = function(data) {
        try {
            const jsonString = JSON.stringify(data);
            
            if (storageMethod === 'localStorage') {
                localStorage.setItem(STORAGE_KEY, jsonString);
            } else if (storageMethod === 'sessionStorage') {
                sessionStorage.setItem(STORAGE_KEY, jsonString);
            } else if (storageMethod === 'cookie') {
                setCookie(STORAGE_KEY, jsonString, 365); // یک سال
            }
            
            console.log('✅ داده ذخیره شد با روش:', storageMethod);
            return true;
        } catch (e) {
            console.error('❌ خطا در ذخیره‌سازی:', e);
            
            // fallback نهایی به کوکی
            try {
                const jsonString = JSON.stringify(data);
                setCookie(STORAGE_KEY, jsonString, 365);
                console.log('🔄 داده با کوکی ذخیره شد (fallback)');
                return true;
            } catch (e2) {
                console.error('❌ ذخیره‌سازی کاملاً ناموفق:', e2);
                return false;
            }
        }
    };

    // ==================== بازیابی داده ====================
    window.loadData = function() {
        try {
            let jsonString = null;
            
            if (storageMethod === 'localStorage') {
                jsonString = localStorage.getItem(STORAGE_KEY);
            } else if (storageMethod === 'sessionStorage') {
                jsonString = sessionStorage.getItem(STORAGE_KEY);
            } else if (storageMethod === 'cookie') {
                jsonString = getCookie(STORAGE_KEY);
            }
            
            // اگر با روش اصلی پیدا نشد، همه جا رو بگرد
            if (!jsonString) {
                jsonString = localStorage.getItem(STORAGE_KEY) || 
                             sessionStorage.getItem(STORAGE_KEY) || 
                             getCookie(STORAGE_KEY);
            }
            
            if (!jsonString) return null;
            
            const data = JSON.parse(jsonString);
            
            // اطمینان از ساختار کامل
            if (!data.progress) {
                data.progress = {
                    currentStage: 1,
                    completedStages: [],
                    quizResults: {}
                };
            }
            if (!data.progress.completedStages) data.progress.completedStages = [];
            if (!data.progress.quizResults) data.progress.quizResults = {};
            if (!data.progress.currentStage) data.progress.currentStage = 1;
            
            console.log('✅ داده بازیابی شد:', {
                name: data.fullName,
                currentStage: data.progress.currentStage,
                completed: data.progress.completedStages.length
            });
            
            return data;
        } catch (e) {
            console.error('❌ خطا در بازیابی داده:', e);
            return null;
        }
    };

    // ==================== پاک کردن داده ====================
    window.clearData = function() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            deleteCookie(STORAGE_KEY);
            console.log('🗑️ تمام داده‌ها پاک شدند');
            return true;
        } catch (e) {
            console.error('❌ خطا در پاک کردن داده:', e);
            return false;
        }
    };

    // ==================== تکمیل مرحله ====================
    window.completeStage = function(stageNumber, quizResult) {
        const userData = window.loadData();
        if (!userData) {
            console.error('❌ کاربر یافت نشد');
            return false;
        }

        if (!userData.progress.completedStages.includes(stageNumber)) {
            userData.progress.completedStages.push(stageNumber);
        }

        const nextStage = stageNumber + 1;
        if (nextStage > userData.progress.currentStage && nextStage <= 31) {
            userData.progress.currentStage = nextStage;
        }

        if (quizResult) {
            userData.progress.quizResults['stage' + stageNumber] = {
                ...quizResult,
                completedAt: new Date().toISOString()
            };
        }

        console.log('🎉 مرحله', stageNumber, 'تکمیل شد! مرحله فعلی:', userData.progress.currentStage);
        return window.saveData(userData);
    };

    // ==================== بررسی دسترسی ====================
    window.canAccessStage = function(stageNumber) {
        const userData = window.loadData();
        if (!userData) return { allowed: false, reason: 'no_user' };

        const currentStage = userData.progress.currentStage || 1;
        const completedStages = userData.progress.completedStages || [];

        if (completedStages.includes(stageNumber)) return { allowed: true, reason: 'completed' };
        if (stageNumber === currentStage) return { allowed: true, reason: 'current' };
        if (stageNumber < currentStage) return { allowed: true, reason: 'previous' };
        
        return { allowed: false, reason: 'locked', currentStage: currentStage };
    };

    console.log('📦 data-manager.js آماده است | آکادمی بردیا فاتحی');
    console.log('🔧 روش ذخیره‌سازی:', storageMethod);
})();
