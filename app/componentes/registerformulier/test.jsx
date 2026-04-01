    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        if (isRegistering) {
            const animationElemens = document.querySelectorAll('.animate');
            const logindesignFoto = document.querySelector('.loginBackground > img');
            const title = document.querySelector('.loginBackground > h1');
            const Loginform = document.querySelector('.loginForm');
            let animationDelay = 0;

            animationElemens.forEach(element => {
                element.classList.add('hide');
                element.style.animationDelay = animationDelay + 's';
                animationDelay += 0.1;
            });
            
            logindesignFoto.style.animation = 'fade 0.5s ease-in-out forwards';
            title.style.animation = 'fade 0.5s ease-in-out forwards';
            
            const timeout1 = setTimeout(() => {
                const container = document.querySelector('.container');
                container.classList.add('animate');
                animationElemens.forEach(element => {
                    element.style.display = 'none';
                });

                logindesignFoto.style.display = 'none';
                Loginform.style.display = 'none';
            }, 300);

            const timeout2 = setTimeout(() => {
                const registerForm = document.querySelector('.registerForm');
                registerForm.style.display = 'block';
                title.innerHTML = `Welkom bij <br /> <span class="Momentum">Momentum</span>`;
                title.classList.add('RegisterTitle');
                title.style.animation = 'none';
                title.style.opacity = '1';
                title.classList.remove('hide');
                title.classList.add('RegisterTitle');

                const registerAnimationElements = document.querySelectorAll('.animateRegister');
                let registerAnimationDelay = 0;
                registerAnimationElements.forEach(element => {
                    element.style.animation = 'showAnimation 0.4s ease-in-out forwards';
                    element.style.animationDelay = registerAnimationDelay + 's';
                    registerAnimationDelay += 0.03;
                });
            }, 1400);

            return () => {
                clearTimeout(timeout1);
                clearTimeout(timeout2);
            };
        }
    }, [isRegistering]);
    
    if(!isRegistering){
            const registerAnimationElements = document.querySelectorAll('.animateRegister');
            let registerAnimationDelay = 0;
            registerAnimationElements.forEach(element => {
                element.style.display = 'none';
            });
    }

    const toggleForm = () => {
        setIsRegistering(prev => !prev);
    };