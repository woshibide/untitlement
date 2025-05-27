document.addEventListener('DOMContentLoaded', function() {
    // debug mode - set to true to see debug messages in console
    const debugMode = false;

    // debug logging function that only logs when debug mode is on
    function debugLog(...args) {
        if (debugMode) {
            console.log(`[DEBUG] ${new Date().toISOString().substr(11, 8)}:`, ...args);
        }
    }

    // get all slides
    const projectWrappers = document.querySelectorAll('.slide-project-wrapper');
    const aSlides = document.querySelectorAll('.a-slide');
    const totalSlides = aSlides.length;
    
    // navigation elements
    const slidesNavElement = document.getElementById('slides-nav');
    const currentSlideNumberContainer = document.getElementById('slides-current-number-container');
    const totalSlidesNumberElement = document.getElementById('slides-total-number');
    const currentProjectContainer = document.getElementById('slides-current-project-container');
    
    let currentSlideIndex = 0;
    let currentProjectId = '';
    
    // update total slides in navigation
    // subtract 1 because the first slide ('hello') doesn't count towards the project total
    totalSlidesNumberElement.textContent = String(totalSlides - 1).padStart(2, '0');
    
    // populate the slide numbers container
    function populateSlideNumbers() {
        currentSlideNumberContainer.innerHTML = '';
        
        // number each slide
        for (let i = 0; i < totalSlides; i++) {
            const numberElement = document.createElement('div');
            numberElement.className = 'number';
            numberElement.textContent = String(i).padStart(2, '0');
            currentSlideNumberContainer.appendChild(numberElement);
        }
    }
    
    // populate the project names container
    function populateProjectNames() {
        currentProjectContainer.innerHTML = '';
        
        // collect unique project ids
        const projectIds = [];
        projectWrappers.forEach(wrapper => {
            const id = wrapper.id;
            if (!projectIds.includes(id) && id !== 'slide-hello') {
                projectIds.push(id);
            }
        });
        
        // create placeholder for hello slide
        const helloElement = document.createElement('div');
        helloElement.className = 'project-name';
        helloElement.textContent = '';
        currentProjectContainer.appendChild(helloElement);
        
        // create a project name element for each project
        projectIds.forEach(id => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-name';
            projectElement.textContent = id;
            projectElement.setAttribute('data-project-id', id);
            
            // add click event listener for navigation
            projectElement.addEventListener('click', function(e) {
                e.stopPropagation(); // le preventivo
                const targetId = this.getAttribute('data-project-id');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({behavior: 'smooth'});
                    
                    // update URL hash
                    history.pushState(null, null, `#${targetId}`);
                }
            });
            
            currentProjectContainer.appendChild(projectElement);
        });
    }
    
    // to detect current slide
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // slide needs to be at least 50% visible to be considered current
    };
    
    // navigation based on current slide
    function updateNavigation(slideElement) {
        // find the index of the current slide
        const slideIndex = Array.from(aSlides).indexOf(slideElement);
        
        // only update if the slide index has changed
        if (slideIndex !== currentSlideIndex) {
            debugLog(`Slide changed: ${currentSlideIndex} → ${slideIndex}`);
            
            // add "in-view" class to trigger animations
            aSlides.forEach(slide => slide.classList.remove('in-view'));
            slideElement.classList.add('in-view');
            
            // get project name from parent slide-project-wrapper's id
            const projectWrapper = slideElement.closest('.slide-project-wrapper');
            const projectId = projectWrapper ? projectWrapper.id : 'unknown';
            
            // check if we're on the hello slide
            const isHelloSlide = projectId === 'slide-hello';
            
            // toggle hello-slide class on nav for opacity effect
            if (isHelloSlide) {
                slidesNavElement.classList.add('hello-slide');
            } else {
                slidesNavElement.classList.remove('hello-slide');
            }
            
            // update the slide number by transforming the container
            const transformAmount = -slideIndex * 1.2; // 1.2em is the height of each number element
            currentSlideNumberContainer.style.transform = `translateY(calc(${transformAmount}em - 1px))`;
            
            // update the project name by transforming the container
            if (projectId !== currentProjectId) {
                // find the index of the project in our container
                const projectIndex = isHelloSlide ? 0 : Array.from(projectWrappers)
                    .filter(wrapper => wrapper.id !== 'slide-hello')
                    .findIndex(wrapper => wrapper.id === projectId) + 1;  // +1 for the hello slide placeholder
                
                // transform the project container
                if (projectIndex >= 0) {
                    currentProjectContainer.style.transform = `translateY(${-projectIndex * 1.2}em)`;
                }
                
                currentProjectId = projectId;
            }
            
            currentSlideIndex = slideIndex;
            
            // update url hash without triggering a scroll
            if (!isHelloSlide) {
                const newUrl = window.location.pathname + '#' + projectId;
                history.replaceState(null, null, newUrl);
            }
        }
    }
    
    // manage p5.js sketches visibility
    function handleP5Visibility(slideElement, isIntersecting) {
        const p5Container = slideElement.querySelector('.p5js-container');
        if (p5Container) {
            if (isIntersecting && !p5Container.classList.contains('initialized')) {
                // initialize p5 sketch if it's visible and not already initialized
                const sketchId = p5Container.getAttribute('data-sketch-id');
                if (sketchId) {
                    debugLog(`Loading p5 sketch: ${sketchId} in container: ${p5Container.id}`);
                    initializeP5Sketch(p5Container.id, sketchId);
                }
            } else if (!isIntersecting && p5Container.classList.contains('initialized')) {
                // deactivate p5 sketch when it's not visible anymore
                const sketchId = p5Container.getAttribute('data-sketch-id');
                debugLog(`Unloading p5 sketch: ${sketchId} from container: ${p5Container.id}`);
                deactivateP5Sketch(p5Container);
            }
        }
    }
    
    // deactivate p5 sketch to save resources
    function deactivateP5Sketch(p5Container) {
        // p5 instance is stored in the container's sketchInstance property
        if (p5Container.sketchInstance) {
            const sketchId = p5Container.getAttribute('data-sketch-id') || 'unknown';
            debugLog(`Removing p5 sketch: ${sketchId} instance`);
            
            // remove the canvas element
            const canvasWrapper = p5Container.querySelector('.canvas-wrapper');
            if (canvasWrapper && canvasWrapper.firstChild) {
                canvasWrapper.removeChild(canvasWrapper.firstChild);
            }
            
            // call any cleanup methods if available
            if (typeof p5Container.sketchInstance.remove === 'function') {
                p5Container.sketchInstance.remove();
            }
            
            // mark as not initialized so it can be recreated when visible again
            p5Container.classList.remove('initialized');
            p5Container.sketchInstance = null;
        }
    }
    
    // manage video iframes and HTML5 videos visibility
    function handleVideoVisibility(slideElement, isIntersecting) {
        // handle Vimeo
        const videoContainer = slideElement.querySelector('.video-container iframe');
        if (videoContainer) {
            if (isIntersecting) {
                // if vimeo player api is loaded
                if (window.Vimeo && typeof window.Vimeo.Player === 'function') {
                    try {
                        // try to get or create a player instance
                        if (!videoContainer.player) {
                            videoContainer.player = new Vimeo.Player(videoContainer);
                        }
                        debugLog(`Playing Vimeo video in slide: ${getSlideIdentifier(slideElement)}`);
                        videoContainer.player.play();
                    } catch (e) {
                        debugLog(`Error initializing Vimeo player:`, e);
                    }
                }
            } else {
                // pause the video when not in view
                if (videoContainer.player) {
                    debugLog(`Pausing Vimeo video in slide: ${getSlideIdentifier(slideElement)}`);
                    videoContainer.player.pause();
                }
            }
        }
        
        // handle HTML5 video
        // const videoElement = slideElement.querySelector('video');
        // if (videoElement) {
        //     if (isIntersecting) {
        //         // play video when it's visible
        //         if (videoElement.paused) {
        //             // attempt to play might fail if user hasn't interacted with page yet
        //             debugLog(`Playing HTML5 video in slide: ${getSlideIdentifier(slideElement)}`);
        //             videoElement.play().catch(err => {
        //                 // silently handle autoplay restrictions
        //                 debugLog(`Failed to autoplay video:`, err);
        //             });
        //         }
        //     } else {
        //         // pause video when it's not visible
        //         if (!videoElement.paused) {
        //             debugLog(`Pausing HTML5 video in slide: ${getSlideIdentifier(slideElement)}`);
        //             videoElement.pause();
        //         }
        //     }
        // }
    }

    // helper function to get slide identifier for debugging
    function getSlideIdentifier(slideElement) {
        const slideIndex = Array.from(aSlides).indexOf(slideElement);
        const projectWrapper = slideElement.closest('.slide-project-wrapper');
        const projectId = projectWrapper ? projectWrapper.id : 'unknown';
        return `${projectId}[${slideIndex}]`;
    }
    
    // populate the slide numbers and project names containers
    populateSlideNumbers();
    populateProjectNames();
    
    // set up observer for a-slides
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const slideIdentifier = getSlideIdentifier(entry.target);
            debugLog(`Slide visibility changed: ${slideIdentifier}, isIntersecting: ${entry.isIntersecting}`);
            
            // handle p5js and video visibility
            handleP5Visibility(entry.target, entry.isIntersecting);
            handleVideoVisibility(entry.target, entry.isIntersecting);
            
            if (entry.isIntersecting) {
                updateNavigation(entry.target);
            }
        });
    }, options);
    
    // observe all a-slides
    aSlides.forEach(slide => {
        observer.observe(slide);
    });
    
    // handle initial hash navigation
    function navigateToHash() {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.substring(1); // remove the # character
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // scroll to the target element with a slight delay to ensure proper loading
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }, 100);
                
                // find the first a-slide within the target and update navigation
                const targetSlide = targetElement.querySelector('.a-slide');
                if (targetSlide) {
                    updateNavigation(targetSlide);
                }
                return true;
            }
        }
        return false;
    }
    
    // navigate to hash on page load if present
    if (!navigateToHash()) {
        // if no hash or invalid hash, show the first slide
        if (aSlides.length > 0) {
            updateNavigation(aSlides[0]);
            
            // explicitly add in-view class to first slide when page loads
            // to ensure animations play right away
            aSlides[0].classList.add('in-view');
        }
    }
    
    // ensure the first visible slide gets the in-view class on page load
    // this handles cases where intersection observer might miss the initial slide
    document.addEventListener('DOMContentLoaded', () => {
        // short timeout to ensure everything is properly loaded
        setTimeout(() => {
            const firstVisibleSlide = findCurrentVisibleSlide();
            if (firstVisibleSlide) {
                firstVisibleSlide.classList.add('in-view');
            }
        }, 100);
    });
    
    // p5.js initialization with loading simulation
    function initializeP5Sketch(containerId, sketchId = 'default') {
        const container = document.getElementById(containerId);
        if (!container || container.classList.contains('initialized')) return;
        
        debugLog(`Initializing p5 sketch: ${sketchId} in container: ${containerId}`);
        
        // mark as initialized so it doesn't set up multiple times
        container.classList.add('initialized');
        
        // get curtain elements
        const curtain = container.querySelector('.canvas-curtain');
        const leftCurtain = container.querySelector('.canvas-curtain-half.left');
        const rightCurtain = container.querySelector('.canvas-curtain-half.right');
        const loadingPercentage = container.querySelector('.canvas-loading-percentage');
        
        // determine which sketch to load based on sketchId
        let sketchPath = `/dumbar/p5-sketches/${sketchId}/sketch.js`;
        
        // simulate loading process
        let loadProgress = 0;
        let loadingTimeoutId = null;
        let loadingComplete = false;
        let minLoadingTime = 800; // minimum loading time in ms
        
        // update loading percentage visually
        function updateLoadingUI(progress) {
            loadingPercentage.textContent = `${Math.floor(progress)}%`;
        }
        
        // start simulated loading progress
        function startLoadingSimulation() {
            // reset loading state
            loadProgress = 0;
            updateLoadingUI(loadProgress);
            
            // make sure curtain is visible
            curtain.style.display = 'flex';
            loadingPercentage.classList.remove('hidden');
            leftCurtain.classList.remove('open');
            rightCurtain.classList.remove('open');
            
            // simulate gradual loading progress
            const simulateLoading = () => {
                // increase load progress more slowly as we approach 100%
                if (loadProgress < 90) {
                    loadProgress += Math.random() * 8 + 2; // 2-10% increment
                } else {
                    loadProgress += Math.random() * 2; // 0-2% increment when near completion
                }
                
                if (loadProgress > 99) {
                    loadProgress = 99; // cap at 99% until actually loaded
                }
                
                updateLoadingUI(loadProgress);
                
                // continue simulation if not complete
                if (!loadingComplete) {
                    loadingTimeoutId = setTimeout(simulateLoading, 100 + Math.random() * 200);
                }
            };
            
            // start the simulation
            simulateLoading();
            
            // ensure minimum loading time
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, minLoadingTime);
            });
        }
        
        // complete the loading process
        function completeLoading() {
            // clear any pending simulation timeouts
            if (loadingTimeoutId) {
                clearTimeout(loadingTimeoutId);
            }
            
            // mark loading as complete
            loadingComplete = true;
            loadProgress = 100;
            updateLoadingUI(loadProgress);
            
            // hide percentage and open curtains
            setTimeout(() => {
                loadingPercentage.classList.add('hidden');
                leftCurtain.classList.add('open');
                rightCurtain.classList.add('open');
                
                // remove loader after animation completes
                setTimeout(() => {
                    curtain.style.display = 'none';
                }, 1200);
            }, 200);
        }
        
        // start the loading simulation
        startLoadingSimulation().then(() => {
            // attempt to load the sketch script
            const scriptElem = document.createElement('script');
            scriptElem.src = sketchPath;
            
            scriptElem.onload = function() {
                // load the sketch after simulation completes
                if (typeof loadP5Sketch === 'function') {
                    // use the script's loadP5Sketch function
                    const sketch = loadP5Sketch(container);
                    
                    // store sketch instance for later cleanup
                    container.sketchInstance = sketch;
                    
                    // complete the loading process
                    completeLoading();
                } else {
                    // fallback to default sketch if no loadP5Sketch function found
                    loadDefaultSketch(container, curtain, leftCurtain, rightCurtain, loadingPercentage);
                }
            };
            
            scriptElem.onerror = function() {
                // if sketch script fails to load, use default sketch
                debugLog(`Failed to load p5 sketch: ${sketchPath}. Using default sketch.`);
                loadDefaultSketch(container, curtain, leftCurtain, rightCurtain, loadingPercentage);
            };
            
            document.head.appendChild(scriptElem);
        });
        
        // fallback in case script never loads within 5 seconds
        setTimeout(() => {
            if (!container.sketchInstance) {
                debugLog(`p5 sketch failed to load in time: ${sketchPath}`);
                loadDefaultSketch(container, curtain, leftCurtain, rightCurtain, loadingPercentage);
            }
        }, 5000);
    }
    
    // default p5 sketch with curtain animation
    function loadDefaultSketch(container, curtain, leftCurtain, rightCurtain, loadingPercentage) {
        debugLog(`Loading default fallback sketch for container: ${container.id}`);

        const sketch = new p5(function(p) {
            
            // dvd stuff
            let x, y;
            let xSpeed = 2;
            let ySpeed = 1.5;
            let dvdWidth = 350;
            let dvdHeight = 90;
            let textColor;
            

            p.setup = function() {
                const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
                canvas.parent(container.querySelector('.canvas-wrapper'));
                p.background(0);
                
                // initialize position to center
                x = p.width / 2 - dvdWidth / 2;
                y = p.height / 2 - dvdHeight / 2;
                
                textColor = p.color(
                    p.random(100, 255),
                    p.random(100, 255),
                    p.random(100, 255)
                );
                
                p.textSize(16);
                p.textAlign(p.CENTER, p.CENTER);
            };
            
            p.draw = function() {
                p.background(20, 20);
                
                // draw dvd
                p.fill(textColor);
                p.noStroke();
                p.rect(x, y, dvdWidth, dvdHeight);
                
                p.fill(0);
                p.text("something went wrong...", x + dvdWidth/2, y + dvdHeight/2 - 10);
                p.text("but at least dvd thingy is here flying", x + dvdWidth/2, y + dvdHeight/2 + 10);
                p.text("maybe see next one and comeback here later", x + dvdWidth/2, y + dvdHeight/2 + 30);
                
                // update position
                x += xSpeed;
                y += ySpeed;
                
                // check for bounces on edges
                if (x <= 0 || x + dvdWidth >= p.width) {
                    xSpeed *= -1;
                    changeColor();
                }
                
                if (y <= 0 || y + dvdHeight >= p.height) {
                    ySpeed *= -1;
                    changeColor();
                }
            };
            
            function changeColor() {
                textColor = p.color(
                    p.random(100, 255),
                    p.random(100, 255),
                    p.random(100, 255)
                );
            }
            
            p.windowResized = function() {
                p.resizeCanvas(container.clientWidth, container.clientHeight);
                
                // ensure dvd logo stays within bounds after resize
                x = p.constrain(x, 0, p.width - dvdWidth);
                y = p.constrain(y, 0, p.height - dvdHeight);
            };
        });
        
        // store sketch instance for later cleanup
        container.sketchInstance = sketch;
        
        // open curtains immediately
        loadingPercentage.classList.add('hidden');
        leftCurtain.classList.add('open');
        rightCurtain.classList.add('open');
        
        setTimeout(() => {
            curtain.style.display = 'none';
        }, 1200);
    }
    
    // keyboard navigation
    document.addEventListener('keydown', function(event) {
        // find the currently visible slide
        const currentSlide = findCurrentVisibleSlide();
        if (!currentSlide) return;
        
        const currentProject = currentSlide.closest('.slide-project-wrapper');
        
        if (['ArrowDown', ' ', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) {
            debugLog(`Navigation key pressed: ${event.key}`);
        }
        
        if (event.key === 'ArrowDown' || event.key === ' ' || event.key === 'PageDown') {
            event.preventDefault();
            
            // find next slide or project
            const nextSlide = currentSlide.nextElementSibling;
            if (nextSlide && nextSlide.classList.contains('a-slide')) {
                nextSlide.scrollIntoView({behavior: 'smooth'});
            } else {
                // go to next project
                const nextProject = currentProject.nextElementSibling;
                if (nextProject && nextProject.classList.contains('slide-project-wrapper')) {
                    nextProject.scrollIntoView({behavior: 'smooth'});
                }
            }
        } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
            event.preventDefault();
            
            // find previous slide or project
            const prevSlide = currentSlide.previousElementSibling;
            if (prevSlide && prevSlide.classList.contains('a-slide')) {
                prevSlide.scrollIntoView({behavior: 'smooth'});
            } else {
                // go to previous project
                const prevProject = currentProject.previousElementSibling;
                if (prevProject && prevProject.classList.contains('slide-project-wrapper')) {
                    // go to last slide of previous project
                    const prevProjectSlides = prevProject.querySelectorAll('.a-slide');
                    prevProjectSlides[prevProjectSlides.length - 1].scrollIntoView({behavior: 'smooth'});
                }
            }
        }
    });
    
    // helper function to find the most visible slide
    function findCurrentVisibleSlide() {
        let maxVisibility = 0;
        let mostVisibleSlide = null;
        
        aSlides.forEach(slide => {
            const rect = slide.getBoundingClientRect();
            const visibility = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            
            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                mostVisibleSlide = slide;
            }
        });
        
        return mostVisibleSlide;
    }
    
    // listen for hash changes
    window.addEventListener('hashchange', navigateToHash);
    
    // handle home page redirection
    window.redirectToHomePage = function() {
        window.location.href = '/';
    };
});