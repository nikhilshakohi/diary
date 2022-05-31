//React Tools
import { Routes, Route } from 'react-router-dom';
//Pages
import Login from './Login';
import Home from './Home';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTheme } from './ThemeContext';
//Material-UI
import { createTheme, ThemeProvider } from '@mui/material/styles'; //Material createTheme and ThemeProviders

function App() {

    const currentUser = useAuth(); //Get status of user from AuthContext

    const { mode } = useCurrentTheme();

    const currentTheme = createTheme({ palette: { mode:mode, } });
    
    return (
        <div>
            <ThemeProvider theme={currentTheme}>
                <Routes>
                    <Route path="/" element={currentUser.currentUser ? <Home /> : <Login />} />
                    <Route path="/Login" element={currentUser.currentUser ? <Home /> : <Login />} />
                    <Route path="/Home" element={currentUser.currentUser ? <Home /> : <Login />} />
                </Routes>
            </ThemeProvider>
        </div>
    );
}

export default App;
