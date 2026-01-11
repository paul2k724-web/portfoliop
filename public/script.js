
document.addEventListener('DOMContentLoaded', function () {
    initParticles();
    initScrollAnimations();
    initNavbar();
    initCounterAnimation();
    initProgressBars();
    initTiltEffect();
    initContactForm();
    initSmoothScroll();
    loadDynamicContent();
});

function initParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 4 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;

    const colors = ['#00f0ff', '#7b2dff', '#ff00ea', '#00ff88'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        opacity: ${Math.random() * 0.5 + 0.2};
        box-shadow: 0 0 ${size * 2}px ${color};
        animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
        pointer-events: none;
    `;

    container.appendChild(particle);
}

const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
        }
        25% {
            transform: translateY(-30px) translateX(20px) scale(1.1);
            opacity: 0.6;
        }
        50% {
            transform: translateY(-50px) translateX(-10px) scale(0.9);
            opacity: 0.4;
        }
        75% {
            transform: translateY(-20px) translateX(-30px) scale(1.05);
            opacity: 0.5;
        }
    }
`;
document.head.appendChild(particleStyles);

function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                const progressBars = entry.target.querySelectorAll('.progress-bar');
                progressBars.forEach(bar => {
                    const progress = bar.getAttribute('data-progress');
                    bar.style.setProperty('--progress', progress + '%');
                });
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = parseInt(target.getAttribute('data-count'));
                animateCounter(target, countTo);
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const progress = bar.getAttribute('data-progress');
                setTimeout(() => {
                    bar.style.setProperty('--width', progress + '%');
                }, 300);
            }
        });
    }, observerOptions);

    progressBars.forEach(bar => observer.observe(bar));
}

function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

function initContactForm() {
    const form = document.getElementById('contactForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            let isValid = true;

            if (name.trim().length < 2) {
                showError('name', 'Please enter a valid name');
                isValid = false;
            } else {
                clearError('name');
            }

            if (!isValidEmail(email)) {
                showError('email', 'Please enter a valid email');
                isValid = false;
            } else {
                clearError('email');
            }

            if (subject.trim().length < 3) {
                showError('subject', 'Please enter a subject');
                isValid = false;
            } else {
                clearError('subject');
            }

            if (message.trim().length < 10) {
                showError('message', 'Please enter a longer message');
                isValid = false;
            } else {
                clearError('message');
            }

            if (isValid) {
                const button = form.querySelector('.btn-submit');
                const originalText = button.querySelector('.btn-text').textContent;
                button.querySelector('.btn-text').textContent = 'Sending...';
                button.disabled = true;

                setTimeout(() => {
                    button.querySelector('.btn-text').textContent = 'Message Sent!';
                    button.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';

                    setTimeout(() => {
                        form.reset();
                        button.querySelector('.btn-text').textContent = originalText;
                        button.style.background = '';
                        button.disabled = false;
                    }, 3000);
                }, 1500);
            }
        });
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement;

    let errorEl = formGroup.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.style.cssText = 'color: #ff4757; font-size: 0.8rem; margin-top: 0.5rem; display: block;';
        formGroup.appendChild(errorEl);
    }
    errorEl.textContent = message;
    field.style.borderColor = '#ff4757';
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement;
    const errorEl = formGroup.querySelector('.error-message');
    if (errorEl) {
        errorEl.remove();
    }
    field.style.borderColor = '';
}

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
});

const glowElements = document.querySelectorAll('.skill-card, .project-card, .cert-card');
glowElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mouse-x', x + '%');
        el.style.setProperty('--mouse-y', y + '%');
    });
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.shape');

    parallaxElements.forEach((el, index) => {
        const speed = (index + 1) * 0.1;
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

console.log('%c Welcome to my Portfolio! ', 'background: linear-gradient(135deg, #00f0ff, #7b2dff); color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('%c Built with passion and curiosity ', 'color: #00f0ff; font-size: 12px;');
/* ---------- About profile upload + preview (append to script.js) ---------- */

/* --- DYNAMIC CONTENT LOADING --- */
async function loadDynamicContent() {
    await Promise.all([
        fetchProjects(),
        fetchCertificates()
    ]);

    // Re-init animations for new elements
    if (typeof initTiltEffect === 'function') initTiltEffect();

    // Re-attach scroll observer to new elements
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                const progressBars = entry.target.querySelectorAll('.progress-bar');
                progressBars.forEach(bar => {
                    const progress = bar.getAttribute('data-progress');
                    // Small delay to ensure transition works
                    setTimeout(() => {
                        bar.style.setProperty('--width', progress + '%'); // Fixed: use --width as per css/js logic
                    }, 100);
                });
            }
        });
    }, observerOptions);

    // Observe all new animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        observer.observe(el);
    });
}

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        const container = document.getElementById('projects-list-container');

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #888;">No projects added yet.</p>';
            return;
        }

        container.innerHTML = projects.map(p => `
            <div class="project-card glass-card animate-on-scroll" data-tilt>
                <div class="project-image">
                    ${p.image_url ?
                `<img src="${p.image_url}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;">` :
                `<div class="project-placeholder"><i class="fas fa-laptop-code"></i></div>`
            }
                    <div class="project-overlay">
                        ${p.demo_url ? `<a href="${p.demo_url}" class="project-link" target="_blank"><i class="fas fa-external-link-alt"></i></a>` : ''}
                        ${p.repo_url ? `<a href="${p.repo_url}" class="project-link" target="_blank"><i class="fab fa-github"></i></a>` : ''}
                    </div>
                </div>
                <div class="project-content">
                    <span class="project-category">Project</span>
                    <h3 class="project-title">${p.title}</h3>
                    <p class="project-description">${p.short_description || ''}</p>
                    <div class="project-tech">
                        ${(p.tech_stack || []).map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error loading projects:", err);
    }
}

async function fetchCertificates() {
    try {
        // Static certifications as per user request for simpler management
        const certs = [
            {
                title: "Meta Front-End Developer",
                issuer: "Coursera / Meta",
                status: "Completed",
                progress_percent: 100,
                credential_url: "#"
            },
            {
                title: "AWS Cloud Practitioner",
                issuer: "Amazon Web Services",
                status: "In Progress",
                progress_percent: 65,
                credential_url: ""
            }
        ];

        const container = document.getElementById('certs-list-container');
        if (!container) return;

        container.innerHTML = certs.map(c => {
            const statusClass = c.status.toLowerCase().replace(' ', '-');
            let iconClass = 'fa-certificate';
            // Simple icon selection logic
            const title = c.title.toLowerCase();
            if (title.includes('aws') || title.includes('amazon')) iconClass = 'fa-aws';
            else if (title.includes('meta') || title.includes('facebook')) iconClass = 'fa-code';
            else if (title.includes('security') || title.includes('cyber')) iconClass = 'fa-shield-halved';
            else if (title.includes('cloud')) iconClass = 'fa-cloud';

            const cardContent = `
                <div class="cert-badge ${statusClass}">
                    <span>${c.status}</span>
                </div>
                <div class="cert-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3 class="cert-title">
                    ${c.title}
                    ${c.credential_url && c.credential_url !== '#' ? `<a href="${c.credential_url}" target="_blank" style="color:inherit; margin-left:8px;"><i class="fas fa-external-link-alt" style="font-size:0.8em; opacity:0.7;"></i></a>` : ''}
                </h3>
                <p class="cert-description">${c.issuer || ''}</p>
                <div class="cert-progress">
                    <div class="progress-bar" data-progress="${c.progress_percent}"></div>
                    <span>${c.progress_percent}% Prepared</span>
                </div>
            `;

            return `<div class="cert-card glass-card animate-on-scroll">${cardContent}</div>`;
        }).join('');

    } catch (err) {
        console.error("Error loading certificates:", err);
    }
}