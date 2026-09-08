document.addEventListener('DOMContentLoaded', function() {

    // ============================================
    // WRONG URL DETECTION (file:// vs http://)
    // ============================================
    if (window.location.protocol === 'file:') {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#e53e3e;color:#fff;text-align:center;padding:14px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        banner.innerHTML = `⚠️ Wrong URL — Open the portal through the server: <a href="http://localhost:5000/" style="color:#fff;text-decoration:underline;">http://localhost:5000/</a> &nbsp;|&nbsp; Run <code style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:3px;">node server.js</code> in the project folder first.`;
        document.body.prepend(banner);
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    
    if (menuToggle && menu) {
        menuToggle.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('active');
        });
    }
    
    // ============================================
    // NUMBERS-ONLY INPUT ENFORCEMENT
    // ============================================
    const isc2Input = document.querySelector('input[name="MMERGE6"], #memberIsc2Number');
    if (isc2Input) {
        // Automatically strip any non-digit characters on input or paste
        isc2Input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
        });

        // Prevent typing non-numeric keys
        isc2Input.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    }

    // ============================================
    // MEMBERSHIP REGISTRATION FORM HANDLER (API)
    // ============================================
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        membershipForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('input[type="submit"], button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.value = 'Submitting...';
            }

            const formData = new FormData(this);
            const rawIsc2 = formData.get('MMERGE6') || '';
            const isc2Number = rawIsc2.trim().replace(/\D/g, '');
            const email = (formData.get('EMAIL') || '').trim();
            const firstName = (formData.get('FNAME') || '').trim();
            const lastName = (formData.get('LNAME') || '').trim();
            const country = (formData.get('COUNTRY') || '').trim();
            const city = (formData.get('CITY') || '').trim();
            const jobTitle = (formData.get('MMERGE3') || '').trim();
            const specialisation = (formData.get('MMERGE4') || '').trim();
            const industry = (formData.get('MMERGE5') || '').trim();
            
            const certifications = formData.getAll('certifications[]');
            const workingGroups = formData.getAll('workinggroups[]');

            // Validation: ISC2 Membership Number must be numbers only
            if (!isc2Number || !/^\d+$/.test(isc2Number)) {
                alert('Please enter a valid numeric ISC2 Membership Number (digits only, no letters or special characters).');
                const field = document.getElementById('memberIsc2Number');
                if (field) field.focus();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.value = 'Subscribe';
                }
                return;
            }

            try {
                const response = await fetch('/api/membership/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        firstName,
                        lastName,
                        isc2Number,
                        country,
                        city,
                        jobTitle,
                        specialisation,
                        industry,
                        certifications,
                        workingGroups
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert(`Thank you ${firstName}! Your application (Reference: ${data.requestId}) with ISC2 Member ID [${data.isc2Number}] has been submitted.\nA confirmation notification has been dispatched.`);
                    membershipForm.reset();
                } else {
                    alert(`Application submission failed: ${data.message || 'Please check your inputs and try again.'}`);
                }
            } catch (err) {
                console.error('Submission error:', err);
                alert('An error occurred while connecting to the server. Please ensure the backend is running.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.value = 'Subscribe';
                }
            }
        });
    }

    // ============================================
    // LOGIN FORM HANDLER (API Authentication)
    // ============================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"], .btn-login');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
            }

            const identifier = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!identifier || !password) {
                alert('Please enter your email / ISC2 Membership Number, and password.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('isc2_token', data.token);
                    localStorage.setItem('isc2_user', JSON.stringify(data.user));

                    if (data.user && data.user.role === 'ADMIN') {
                        window.location.href = 'admin.html';
                    } else {
                        alert(`Welcome back, ${data.user.name}!\nSigned in as: ${data.user.email}`);
                    }
                } else {
                    alert(`Login failed: ${data.message || 'Invalid credentials'}`);
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('Unable to connect to the authentication service. Please check your network connection.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            }
        });
    }
});
