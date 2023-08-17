import { Route, Routes } from "react-router-dom";
import "src/styles/style.css";
import ProtectedRoute from "./components/authorization/ProtectedRoute";
import Welcome from "./components/login/Welcome";
import Auth from "src/components/login/Auth";
import TwoFactor from "./components/login/TwoFactor";
import NewUser from "./components/settings/NewUser";
import Home from "src/components/Home";
import { AuthProvider } from "./utils/authLogic";
import NotFound from "./components/NotFound";

function App() {
	return (
		<>
			<AuthProvider>
				<Routes>
					<Route path="/" element={<Welcome />} />
					<Route path="/login" element={<Auth />} />
					<Route path="/2fa" element={<TwoFactor />} />
					<Route path="/new-user" element={<NewUser />} />
					<Route
						path="/home"
						element={
							<ProtectedRoute>
								<Home />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</AuthProvider>
		</>
	);
}
export default App;
