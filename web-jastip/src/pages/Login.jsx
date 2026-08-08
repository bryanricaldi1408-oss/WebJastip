import { A, useNavigate} from "@solidjs/router";
import "../style/Auth.css";
import { createSignal } from "solid-js";
import { setUsers, showNotification, users} from "../store/WebStore"

export const Login = () => {
    const [email, setEmail] = createSignal("")
    const [password, setPassword] = createSignal("")
    const navigate = useNavigate();
    
    async function handleAuth(e){
        e.preventDefault();

        if(email() === "" || password() === ""){
            showNotification("Email dan Password tidak boleh kosong", "error");
            return;
        }
        
        try{
            const response = await fetch('http://localhost:5000/api/login', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email(),
                    password: password()
                })
            });
            const data = await response.json()
            if(response.ok){
                showNotification('Login Berhasil', 'success');
                setUsers("currUser", data.user);
                if(users.currUser?.role === 'admin'){
                    navigate('/admin', { replace: true});
                }else{
                    navigate('/', { replace: true});
                }
            }else{
                showNotification('Password atau email salah', 'error')
            }
        }catch(err){
            showNotification("Error: Tidak bisa menghubungi server.", "error");
        }

    }
    return (
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    Jastip <span class="blue-t">Stella</span>
                </div>
                <h1 class="auth-title">Welcome Back</h1>
                <p class="auth-subtitle">Masuk untuk melanjutkan belanjamu.</p>
                
                <form class="auth-form" onSubmit={handleAuth}>
                    <div>
                        <label>Email Address</label>
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="contoh@email.com" 
                            class="auth-input" 
                            value={email()}
                            onInput={(e) => setEmail(e.target.value)}
                        />
                   
                    </div>
                    <div>
                        <label>Password</label>
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="••••••••" 
                            class="auth-input" 
                            value={password()}
                            onInput={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button type="submit" class="auth-btn">Log In</button>
                </form>

                <div class="auth-footer">
                    Belum punya akun? <A href="/signup" class="auth-link-text">Sign Up di sini</A>
                </div>
            </div>
        </div>
    );
};
