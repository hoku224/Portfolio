// Data Model loaded from projects-data.js
const projects = window.portfolioProjects || [];

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getMediaSource(entry) {
    if (entry && typeof entry === 'object') {
        const url = entry.url || entry.src || '';
        const type = entry.type || entry.kind || (isVideoUrl(url) ? 'video' : 'image');
        return { url, type };
    }

    const url = String(entry || '');
    return { url, type: isVideoUrl(url) ? 'video' : 'image' };
}

function isDriveUrl(url = '') {
    return /(^|\/)drive\.google\.com\//i.test(String(url));
}

function isVideoUrl(url = '') {
    const value = String(url).trim();
    if (!value) {
        return false;
    }

    let pathname = value;
    try {
        pathname = new URL(value, window.location.href).pathname;
    } catch (_) {
        pathname = value.split(/[?#]/, 1)[0];
    }

    return /\.(mp4|webm|mov|m4v)$/i.test(pathname);
}

function getDrivePreviewUrl(url = '') {
    const value = String(url);
    const idMatch = value.match(/\/file\/d\/([^/]+)/i) || value.match(/[?&]id=([^&]+)/i);
    if (!idMatch) {
        return value;
    }
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
}

function renderMediaMarkup(entry, className, options = {}) {
    const { autoplay = true } = options;
    const { url, type } = getMediaSource(entry);
    const safeUrl = encodeURI(url);
    if (type === 'video') {
        if (isDriveUrl(url)) {
            const previewUrl = encodeURI(getDrivePreviewUrl(url));
            return `<iframe src="${previewUrl}" class="${className}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="no-referrer"></iframe>`;
        }
        const autoplayAttr = autoplay ? 'autoplay ' : '';
        return `<video src="${safeUrl}" ${autoplayAttr}muted loop playsinline preload="metadata" class="${className}"></video>`;
    }
    return `<img src="${safeUrl}" alt="" class="${className}" loading="lazy">`;
}

function renderCardPreview(project) {
    if (!project.thumb) {
        return '<div class="card-placeholder">No preview available</div>';
    }
    return renderMediaMarkup(project.thumb, 'card-media', { autoplay: true });
}

function getModalGalleryElements() {
    return {
        gallery: document.getElementById("modal-gallery"),
        counter: document.getElementById("modal-gallery-counter"),
        prevButton: document.getElementById("modal-gallery-prev"),
        nextButton: document.getElementById("modal-gallery-next")
    };
}

function updateModalCarouselState() {
    const { gallery, counter, prevButton, nextButton } = getModalGalleryElements();
    if (!gallery || !counter || !prevButton || !nextButton) {
        return;
    }

    const items = Array.from(gallery.querySelectorAll('.media-item'));
    if (items.length === 0) {
        counter.textContent = '0 / 0';
        prevButton.disabled = true;
        nextButton.disabled = true;
        return;
    }

    const slideWidth = gallery.clientWidth || 1;
    const currentIndex = Math.min(items.length - 1, Math.max(0, Math.round(gallery.scrollLeft / slideWidth)));

    counter.textContent = `${currentIndex + 1} / ${items.length}`;
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === items.length - 1;

    items.forEach((item, index) => {
        const isActive = index === currentIndex;
        item.classList.toggle('is-active', isActive);
        if (item.tagName === 'VIDEO') {
            if (isActive) {
                item.play().catch(() => {});
            } else {
                item.pause();
            }
        }
    });
}

function scrollModalCarousel(direction) {
    const { gallery } = getModalGalleryElements();
    if (!gallery) {
        return;
    }

    const items = gallery.querySelectorAll('.media-item');
    if (items.length === 0) {
        return;
    }

    const slideWidth = gallery.clientWidth || 1;
    const currentIndex = Math.min(items.length - 1, Math.max(0, Math.round(gallery.scrollLeft / slideWidth)));
    const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + direction));
    gallery.scrollTo({ left: nextIndex * slideWidth, behavior: 'smooth' });
}

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("portfolio-grid");
    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => openModal(project);
        card.innerHTML = `
            ${renderCardPreview(project)}
            <div class="card-content">
                <h3 class="card-title">${project.title}</h3>
                <p class="card-desc">${project.description.substring(0, 60)}...</p>
                <p class="card-tags">${project.tags}</p>
            </div>
        `;
        grid.appendChild(card);
    });

    const words = ["Web Apps.", "Flutter Apps.", "Unity Games.", "3D Models."];
    let i = 0, j = 0, isDeleting = false;
    const twElement = document.getElementById("typewriter");
    function type() {
        if(!twElement) return;
        const currentWord = words[i];
        if (isDeleting) {
            twElement.textContent = currentWord.substring(0, j - 1);
            j--;
        } else {
            twElement.textContent = currentWord.substring(0, j + 1);
            j++;
        }
        let speed = isDeleting ? 50 : 100;
        if (!isDeleting && j === currentWord.length) { speed = 2000; isDeleting = true; }
        else if (isDeleting && j === 0) { isDeleting = false; i = (i + 1) % words.length; speed = 500; }
        setTimeout(type, speed);
    }
    type();

    const themeBtn = document.getElementById("theme-toggle");
    const html = document.documentElement;
    if (themeBtn) {
        if (localStorage.getItem("theme") === "dark") { html.setAttribute("data-theme", "dark"); themeBtn.textContent = "☀️"; }
        themeBtn.onclick = () => {
            if (html.getAttribute("data-theme") === "light") {
                html.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
                themeBtn.textContent = "☀️";
            } else {
                html.setAttribute("data-theme", "light");
                localStorage.setItem("theme", "light");
                themeBtn.textContent = "🌙";
            }
        };
    }

    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add("active"); }
        });
    }, { threshold: 0.1 });
    reveals.forEach(reveal => revealObserver.observe(reveal));
    setTimeout(() => { reveals.forEach(r => { if(r.getBoundingClientRect().top < window.innerHeight) r.classList.add("active"); }) }, 100);

    const backBtn = document.getElementById("back-to-top");
    if(backBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) backBtn.classList.add("show");
            else backBtn.classList.remove("show");
        });
        backBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const modal = document.getElementById("project-modal");
    const closeBtn = document.querySelector(".close-btn");
    const { gallery, prevButton, nextButton } = getModalGalleryElements();
    if(closeBtn) {
        closeBtn.onclick = () => closeModal();
    }
    if (prevButton) {
        prevButton.onclick = () => scrollModalCarousel(-1);
    }
    if (nextButton) {
        nextButton.onclick = () => scrollModalCarousel(1);
    }
    if (gallery) {
        gallery.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateModalCarouselState);
        }, { passive: true });
    }
    window.addEventListener('resize', () => {
        window.requestAnimationFrame(updateModalCarouselState);
    });
    window.onclick = (e) => { if (e.target == modal) { closeModal(); } };
});

function closeModal() {
    const modal = document.getElementById("project-modal");
    const gallery = document.getElementById("modal-gallery");
    if (gallery) {
        gallery.querySelectorAll('video').forEach(vid => {
            vid.pause();
            vid.currentTime = 0;
        });
    }
    modal.style.display = "none";
    if (gallery) {
        gallery.innerHTML = '';
    }
    const counter = document.getElementById("modal-gallery-counter");
    if (counter) {
        counter.textContent = '0 / 0';
    }
    const prevButton = document.getElementById("modal-gallery-prev");
    const nextButton = document.getElementById("modal-gallery-next");
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
}

function openModal(project) {
    document.getElementById("modal-title").textContent = project.title;
    document.getElementById("modal-desc").textContent = project.description;
    document.getElementById("modal-tags").textContent = project.tags;
    
    const gallery = document.getElementById("modal-gallery");
    gallery.innerHTML = '';
    
    if (project.media.length === 0) {
        gallery.innerHTML = '<p style="padding: 20px; color: #aaa;">No media files found for this project.</p>';
    } else {
        gallery.innerHTML = project.media.map(url => renderMediaMarkup(url, 'media-item', { autoplay: false })).join('');
    }

    gallery.scrollTo({ left: 0, behavior: 'auto' });
    window.requestAnimationFrame(updateModalCarouselState);

    const downloadsSection = document.getElementById("modal-downloads-section");
    const downloadsList = document.getElementById("modal-downloads");
    if (downloadsSection && downloadsList) {
        if (project.downloads && project.downloads.length > 0) {
            downloadsSection.hidden = false;
            downloadsList.innerHTML = project.downloads
                .map(file => `<a class="download-link" href="${encodeURI(file.url)}" download>${escapeHtml(file.label)}</a>`)
                .join('');
        } else {
            downloadsSection.hidden = true;
            downloadsList.innerHTML = '';
        }
    }
    
    document.getElementById("project-modal").style.display = "flex";
}



