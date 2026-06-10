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
    let emitterInterval = null;

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
            
            const itemWidth = itemElement.offsetWidth;
            const itemHeight = itemElement.offsetHeight;
            const targetTx = 120 - itemElement.offsetLeft - itemWidth / 2;
            const targetTy = 185 - itemElement.offsetTop - itemHeight / 2;
            
            itemElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.8s ease-out';
            itemElement.style.transform = `translate3d(${targetTx}px, ${targetTy}px, 0) scale(0.2)`;
            itemElement.style.opacity = 0;
            
            // Show checkmark and hide cursor & drag items container immediately
            feedbackCheck.classList.remove('fade-out');
            feedbackCheck.classList.add('active');
            banner.classList.remove('has-cursor');
            customCursor.style.opacity = '0';
            dragItemsContainer.classList.add('hidden');
            
            setTimeout(() => {
                // Fade out checkmark and transition to the ready slide with 3D flip
                feedbackCheck.classList.remove('active');
                feedbackCheck.classList.add('fade-out');
                
                // Activate bgReady immediately (by applying active class inside an instant-change reflow)
                // so it's loaded and ready when the card starts rotating.
                banner.classList.add('instant-change');
                bgReady.classList.add('active');
                banner.offsetHeight; // force reflow
                banner.classList.remove('instant-change');

                // Start 180-degree flip animation (duration 1.2s)
                banner.classList.add('card-flipping');
                
                // Swap slide when the card is rotated 180 degrees (i.e. 600ms) and facing away
                setTimeout(() => {
                    banner.classList.add('instant-change');
                    bgMain.classList.remove('active');
                    banner.offsetHeight; // force reflow
                    banner.classList.remove('instant-change');
                    
                    // Add card-flipped-state to set display: none !important on the front face
                    banner.classList.add('card-flipped-state');
                }, 600);
                
                // Switch to permanent flipped state after animation ends (1200ms)
                setTimeout(() => {
                    banner.classList.remove('card-flipping');
                    banner.classList.add('card-flipped');
                }, 1200);
                
                setTimeout(() => {
                    feedbackCheck.classList.remove('fade-out');
                    
                    setTimeout(() => {
                        triggerSuccessFinale();
                    }, 1000); // Let them see the smiling old lady for 1.0s before transformation starts
                }, 1600); // 1.6s total delay (400ms after flip completes)
                
            }, 1000); // Show checkmark for 1.0s
        }
    }

    class Particle {
        constructor(x, y, targetX, targetY, isConverging = true) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            
            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const speed = 3.2 + Math.random() * 3.0;
            const ux = dist > 0 ? dx / dist : 0;
            const uy = dist > 0 ? dy / dist : 0;
            
            this.vx = ux * speed;
            this.vy = uy * speed;
            
            this.radius = 0.4 + Math.random() * 2.2;
            
            const convergingColors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#F0F9FF', '#E0F7FA', '#E1F5FE'];
            const explodingColors = ['#FFFFFF', '#F0F9FF', '#E0F7FA', '#E1F5FE', '#F8BBD0', '#E0F2F1', '#FFFFFF'];
            this.color = isConverging 
                ? convergingColors[Math.floor(Math.random() * convergingColors.length)]
                : explodingColors[Math.floor(Math.random() * explodingColors.length)];
            
            this.opacity = 1.0;
            this.fadeSpeed = 0.005 + Math.random() * 0.004;
            this.life = 1;
            
            this.sparklePhase = Math.random() * Math.PI * 2;
            this.sparkleSpeed = 0.06 + Math.random() * 0.08;
            
            this.state = isConverging ? 'converge' : 'explode';
            this.gravity = 0;
            
            this.history = [];
            this.maxHistory = 3 + Math.floor(Math.random() * 4);
            
            this.wobbleSpeed = 0.06 + Math.random() * 0.1;
            this.wobbleAngle = Math.random() * Math.PI * 2;
            this.wobbleRadius = 0.4 + Math.random() * 0.6;
        }

        update() {
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }

            if (this.state === 'converge') {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 4) {
                    const attraction = 0.09 + Math.random() * 0.07;
                    this.vx += (dx / dist) * attraction;
                    this.vy += (dy / dist) * attraction;
                }
                
                this.vx *= 0.965;
                this.vy *= 0.965;
                
                this.x += this.vx;
                this.y += this.vy;
                

                
                if (this.opacity > 0.4) {
                    this.opacity -= 0.002;
                }
                this.life = this.opacity;
            } else {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.gravity;
                this.vx *= 0.975;
                this.vy *= 0.975;
                
                this.opacity -= this.fadeSpeed;
                this.life = Math.max(0, this.opacity);
            }
            this.sparklePhase += this.sparkleSpeed;
        }

        draw() {
            const currentOpacity = this.life * (0.6 + 0.4 * Math.sin(this.sparklePhase));
            
            if (this.history.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }
                ctx.save();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.radius * 1.1;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = currentOpacity * 0.35;
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.save();
            ctx.globalAlpha = currentOpacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.radius > 0.8) {
                ctx.shadowBlur = 2;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 1.1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function triggerSuccessFinale() {
        const magicGlow = document.getElementById('magicGlow');
        const magicRays = document.getElementById('magicRays');
        
        banner.classList.add('explode-scale');
        
        particles = [];
        let spawnCount = 0;
        clearInterval(emitterInterval);
        
        emitterInterval = setInterval(() => {
            if (spawnCount > 180 || !isGameOver) {
                clearInterval(emitterInterval);
                return;
            }
            
            const side = Math.floor(Math.random() * 4);
            let spawnX, spawnY;
            const borderOffset = 5;
            if (side === 0) {
                spawnX = Math.random() * canvas.width;
                spawnY = borderOffset;
            } else if (side === 1) {
                spawnX = Math.random() * canvas.width;
                spawnY = canvas.height - borderOffset;
            } else if (side === 2) {
                spawnX = borderOffset;
                spawnY = Math.random() * canvas.height;
            } else {
                spawnX = canvas.width - borderOffset;
                spawnY = Math.random() * canvas.height;
            }
            
            const targetX = canvas.width / 2 + (Math.random() - 0.5) * 40;
            const targetY = canvas.height / 2 + (Math.random() - 0.5) * 40;
            
            const p = new Particle(spawnX, spawnY, targetX, targetY, true);
            particles.push(p);
            spawnCount++;
            
            if (!isParticleLoopRunning) {
                isParticleLoopRunning = true;
                requestAnimationFrame(updateParticles);
            }
        }, 4);
        
        // Wait 1600ms for particles to gather in the center first, then start white glow and rays
        setTimeout(() => {
            if (!isGameOver) return;
            magicGlow.classList.remove('fade-out');
            magicGlow.classList.add('active');
            
            magicRays.classList.remove('fade-out');
            magicRays.classList.add('active');
        }, 1600);
        
        // Peak at 2200ms (1600ms delay + 600ms active animation duration)
        setTimeout(() => {
            if (!isGameOver) return;
            
            clearInterval(emitterInterval);
            
            banner.classList.add('instant-change');
            bgReady.classList.remove('active');
            bgEnd.classList.add('active');
            banner.offsetHeight;
            banner.classList.remove('instant-change');
            
            explodeParticles();
            
            magicGlow.classList.remove('active');
            magicGlow.classList.add('fade-out');
            
            magicRays.classList.remove('active');
            magicRays.classList.add('fade-out');
            
            setTimeout(() => {
                isBusy = false;
                
                setTimeout(() => {
                    if (isGameOver) restartGame();
                }, 2500);
            }, 800); // 0.8s fade-out duration
        }, 2200);
    }

    function explodeParticles() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        particles.forEach(p => {
            p.state = 'explode';
            const dx = p.x - p.targetX;
            const dy = p.y - p.targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const speed = 3.5 + Math.random() * 4.0;
            if (dist > 0) {
                p.vx = (dx / dist) * speed;
                p.vy = (dy / dist) * speed;
            } else {
                const angle = Math.random() * Math.PI * 2;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
            }
            p.gravity = 0.02 + Math.random() * 0.03;
            p.fadeSpeed = 0.012 + Math.random() * 0.008;
        });
        
        for (let i = 0; i < 200; i++) {
            const p = new Particle(centerX, centerY, centerX, centerY, false);
            p.state = 'explode';
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.0 + Math.random() * 5.0;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            
            p.radius = 0.3 + Math.random() * 0.7;
            
            const magicColors = ['#FFFFFF', '#F0F9FF', '#E0F7FA', '#E1F5FE', '#F8BBD0', '#E0F2F1', '#FFFFFF'];
            p.color = magicColors[Math.floor(Math.random() * magicColors.length)];
            
            p.gravity = 0.01 + Math.random() * 0.02;
            p.fadeSpeed = 0.008 + Math.random() * 0.008;
            p.sparklePhase = Math.random() * Math.PI * 2;
            p.sparkleSpeed = 0.15 + Math.random() * 0.15;
            
            particles.push(p);
        }
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
        
        clearInterval(emitterInterval);
        banner.classList.remove('slow-fade', 'explode-scale', 'card-flipping', 'card-flipped', 'card-flipped-state');
        const magicGlow = document.getElementById('magicGlow');
        magicGlow.classList.remove('active', 'fade-out');
        
        const magicRays = document.getElementById('magicRays');
        magicRays.classList.remove('active', 'fade-out');
        
        particles = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        feedbackCross.classList.remove('active', 'shake');
        feedbackCheck.classList.remove('active', 'fade-out');
        
        banner.classList.add('instant-change');
        bgReady.classList.remove('active');
        bgEnd.classList.remove('active');
        bgMain.classList.add('active');
        banner.offsetHeight; // force reflow
        banner.classList.remove('instant-change');
        
        dragItemsContainer.classList.remove('hidden');
        customCursor.style.opacity = '';
        banner.classList.remove('has-cursor');
        
        dragItems.forEach(item => {
            item.classList.remove('dragging', 'returning', 'hovered');
            item.style.transform = 'translate3d(0, 0, 0)';
            item.style.opacity = '';
            item.style.zIndex = '';
            item.style.transition = '';
        });
        
        stopIdleAnimation();
        startIdleTimer();
    }

    startIdleTimer();
});
