document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('gameBanner');
    const container = banner.parentElement;
    const bgMain = document.getElementById('bgMain');
    const bgReady = document.getElementById('bgReady');
    const bgEnd = document.getElementById('bgEnd');
    const faceTarget = document.getElementById('faceTarget');
    const dragItems = document.querySelectorAll('.drag-item');
    const customCursor = document.getElementById('gameCursor');
    const feedbackCross = document.getElementById('feedbackCross');
    const feedbackCheck = document.getElementById('feedbackCheck');

    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    const dragItemsContainer = document.getElementById('dragItemsContainer');

    let isGameOver = false;
    let isBusy = false;
    let activeDragItem = null;
    let dragStartPos = { x: 0, y: 0 };
    
    let isUserActive = false;
    let cursorX = 46;
    let cursorY = 243;
    let idleTimer = null;
    let idleAnimId = null;

    let particles = [];
    let isParticleLoopRunning = false;

    const BANNER_WIDTH = 240;
    const BANNER_HEIGHT = 400;
    const CANVAS_PADDING = 40;
    
    canvas.width = BANNER_WIDTH + CANVAS_PADDING * 2;
    canvas.height = BANNER_HEIGHT + CANVAS_PADDING * 2;

    const idlePath = [
        { x: 46, y: 243, duration: 1500 },
        { x: 46, y: 284, duration: 1200, hoverItem: 'lipstick' },
        { x: 125, y: 291, duration: 1200, hoverItem: 'glasses' },
        { x: 197, y: 282, duration: 1200, hoverItem: 'tooth' },
        { x: 120, y: 150, duration: 1500, hoverItem: 'face' }
    ];

    let currentPathIndex = 0;
    let pathStartTime = null;

    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    function runIdleAnimation(timestamp) {
        if (isUserActive || isGameOver) return;
        if (!pathStartTime) pathStartTime = timestamp;
        
        const currentTarget = idlePath[currentPathIndex];
        const prevTarget = idlePath[currentPathIndex === 0 ? idlePath.length - 1 : currentPathIndex - 1];
        
        const elapsed = timestamp - pathStartTime;
        const progress = Math.min(elapsed / currentTarget.duration, 1);
        const easedProgress = easeOutCubic(progress);
        
        cursorX = lerp(prevTarget.x, currentTarget.x, easedProgress);
        cursorY = lerp(prevTarget.y, currentTarget.y, easedProgress);
        
        updateCursorPosition(cursorX, cursorY);
        
        if (progress >= 0.8 && currentTarget.hoverItem) {
            const itemElement = document.getElementById(`item${capitalize(currentTarget.hoverItem)}`);
            if (itemElement) itemElement.classList.add('hovered');
        }
        
        if (progress >= 1) {
            dragItems.forEach(item => item.classList.remove('hovered'));
            currentPathIndex = (currentPathIndex + 1) % idlePath.length;
            pathStartTime = timestamp;
        }
        
        idleAnimId = requestAnimationFrame(runIdleAnimation);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function updateCursorPosition(x, y) {
        customCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function startIdleTimer() {
        if (isGameOver) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (!isUserActive && !isGameOver) {
                banner.classList.add('has-cursor');
                pathStartTime = null;
                currentPathIndex = 0;
                dragItems.forEach(item => item.classList.remove('hovered'));
                idleAnimId = requestAnimationFrame(runIdleAnimation);
            }
        }, 5000);
    }

    function stopIdleAnimation() {
        if (idleAnimId) {
            cancelAnimationFrame(idleAnimId);
            idleAnimId = null;
        }
        dragItems.forEach(item => item.classList.remove('hovered'));
    }

    banner.addEventListener('pointerenter', () => {
        if (isGameOver) return;
        isUserActive = true;
        stopIdleAnimation();
        banner.classList.add('has-cursor');
    });

    banner.addEventListener('pointerleave', () => {
        if (isGameOver) return;
        if (!activeDragItem) {
            isUserActive = false;
            banner.classList.remove('has-cursor');
            startIdleTimer();
        }
    });

    banner.addEventListener('pointermove', (e) => {
        if (isGameOver) return;
        
        if (!isUserActive) {
            isUserActive = true;
            stopIdleAnimation();
            banner.classList.add('has-cursor');
        }
        
        const rect = banner.getBoundingClientRect();
        const scaleX = rect.width / BANNER_WIDTH;
        const scaleY = rect.height / BANNER_HEIGHT;
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;
        
        updateCursorPosition(x, y);
        startIdleTimer();
    });

    dragItems.forEach(item => {
        item.addEventListener('pointerdown', (e) => {
            if (isGameOver || isBusy) return;
            isUserActive = true;
            stopIdleAnimation();
            
            activeDragItem = item;
            item.classList.add('dragging');
            item.classList.remove('returning');
            item.style.zIndex = 100;
            
            const rect = banner.getBoundingClientRect();
            const scaleX = rect.width / BANNER_WIDTH;
            const scaleY = rect.height / BANNER_HEIGHT;
            const pointerX = (e.clientX - rect.left) / scaleX;
            const pointerY = (e.clientY - rect.top) / scaleY;
            
            dragStartPos = {
                x: pointerX - item.offsetLeft,
                y: pointerY - item.offsetTop
            };
            
            item.setPointerCapture(e.pointerId);
        });

        item.addEventListener('pointermove', (e) => {
            if (activeDragItem !== item) return;
            
            const rect = banner.getBoundingClientRect();
            const scaleX = rect.width / BANNER_WIDTH;
            const scaleY = rect.height / BANNER_HEIGHT;
            const pointerX = (e.clientX - rect.left) / scaleX;
            const pointerY = (e.clientY - rect.top) / scaleY;
            
            updateCursorPosition(pointerX, pointerY);
            
            const tx = pointerX - item.offsetLeft - dragStartPos.x;
            const ty = pointerY - item.offsetTop - dragStartPos.y;
            
            item.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });

        item.addEventListener('pointerup', (e) => {
            if (activeDragItem !== item) return;
            
            item.releasePointerCapture(e.pointerId);
            item.classList.remove('dragging');
            activeDragItem = null;
            
            const rect = banner.getBoundingClientRect();
            const style = window.getComputedStyle(item);
            const matrix = new DOMMatrix(style.transform);
            const tx = matrix.m41;
            const ty = matrix.m42;
            
            const itemCenterX = item.offsetLeft + tx + item.offsetWidth / 2;
            const itemCenterY = item.offsetTop + ty + item.offsetHeight / 2;
            
            const faceLeft = faceTarget.offsetLeft;
            const faceRight = faceLeft + faceTarget.offsetWidth;
            const faceTop = faceTarget.offsetTop;
            const faceBottom = faceTop + faceTarget.offsetHeight;
            
            const hit = (itemCenterX >= faceLeft && itemCenterX <= faceRight &&
                         itemCenterY >= faceTop && itemCenterY <= faceBottom);
            
            if (hit) {
                handleDrop(item.dataset.item, item);
            } else {
                returnItemToOrigin(item);
                startIdleTimer();
            }
        });
        
        item.addEventListener('pointercancel', (e) => {
            if (activeDragItem !== item) return;
            item.releasePointerCapture(e.pointerId);
            item.classList.remove('dragging');
            activeDragItem = null;
            returnItemToOrigin(item);
            startIdleTimer();
        });
    });

    function returnItemToOrigin(item) {
        item.classList.add('returning');
        item.style.transform = 'translate3d(0, 0, 0)';
        
        const handleTransitionEnd = () => {
            item.classList.remove('returning');
            item.style.zIndex = '';
            item.removeEventListener('transitionend', handleTransitionEnd);
        };
        item.addEventListener('transitionend', handleTransitionEnd);
    }

    function handleDrop(itemName, itemElement) {
        if (itemName === 'lipstick' || itemName === 'glasses') {
            isBusy = true;
            feedbackCross.classList.add('active', 'shake');
            
            setTimeout(() => {
                feedbackCross.classList.remove('active', 'shake');
                returnItemToOrigin(itemElement);
                isBusy = false;
                startIdleTimer();
            }, 1200);
            
        } else if (itemName === 'tooth') {
            isBusy = true;
            isGameOver = true;
            stopIdleAnimation();
            
            itemElement.style.opacity = 0;
            feedbackCheck.classList.add('active');
            
            setTimeout(() => {
                feedbackCheck.classList.remove('active');
                bgMain.classList.remove('active');
                bgReady.classList.add('active');
                
                dragItemsContainer.classList.add('hidden');
                banner.classList.remove('has-cursor');
                customCursor.style.opacity = '0';
                
                setTimeout(() => {
                    triggerSuccessFinale();
                }, 1500);
                
            }, 1200);
        }
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 5.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1.0; 
            
            this.radius = 0.4 + Math.random() * 1.1;
            
            const colors = ['#FFDF00', '#D4AF37', '#FFD700', '#ECE2C6', '#FFECB3', '#FFFFFF'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            this.gravity = 0.07;
            this.opacity = 1;
            this.fadeSpeed = 0.006 + Math.random() * 0.01;
            this.life = 1;
            
            this.sparklePhase = Math.random() * Math.PI * 2;
            this.sparkleSpeed = 0.12 + Math.random() * 0.12;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.vx *= 0.985;
            this.vy *= 0.985;
            this.opacity -= this.fadeSpeed;
            this.life = Math.max(0, this.opacity);
            this.sparklePhase += this.sparkleSpeed;
        }

        draw() {
            const currentOpacity = this.life * (0.6 + 0.4 * Math.sin(this.sparklePhase));
            
            ctx.save();
            ctx.globalAlpha = currentOpacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.radius > 0.8) {
                ctx.shadowBlur = 4;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function triggerSuccessFinale() {
        particles = [];
        const spawnX = canvas.width / 2;
        const spawnY = canvas.height / 2 - 20;
        
        for (let i = 0; i < 130; i++) {
            particles.push(new Particle(spawnX, spawnY));
        }
        
        if (!isParticleLoopRunning) {
            isParticleLoopRunning = true;
            requestAnimationFrame(updateParticles);
        }
        
        setTimeout(() => {
            bgReady.classList.remove('active');
            bgEnd.classList.add('active');
            
            banner.classList.remove('has-cursor');
            customCursor.style.opacity = '0';
        }, 150);
        
        setTimeout(() => {
            isBusy = false;
            
            setTimeout(() => {
                if (isGameOver) restartGame();
            }, 4500);
        }, 500);
    }

    function updateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        if (particles.length > 0) {
            requestAnimationFrame(updateParticles);
        } else {
            isParticleLoopRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function restartGame() {
        isGameOver = false;
        isBusy = false;
        isUserActive = false;
        activeDragItem = null;
        
        particles = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        feedbackCross.classList.remove('active', 'shake');
        feedbackCheck.classList.remove('active');

        
        bgReady.classList.remove('active');
        bgEnd.classList.remove('active');
        bgMain.classList.add('active');
        
        dragItemsContainer.classList.remove('hidden');
        customCursor.style.opacity = '';
        banner.classList.remove('has-cursor');
        
        dragItems.forEach(item => {
            item.classList.remove('dragging', 'returning', 'hovered');
            item.style.transform = 'translate3d(0, 0, 0)';
            item.style.opacity = '';
            item.style.zIndex = '';
        });
        
        stopIdleAnimation();
        startIdleTimer();
    }

    startIdleTimer();
});
