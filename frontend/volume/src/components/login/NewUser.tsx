import { useQuery } from "@apollo/client";
import "src/styles/login-pages/new-user.css";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import Loading from "../authorization/Loading";
import NewUserForm from "./NewUserForm";

function NewUser(): JSX.Element {
	const { loading, error, data } = useQuery(CURRENT_USER);

	if (loading) return <Loading />;
	if (error) {
		if (gqlErrorCode(error) == "UNAUTHENTICATED") {
			return <Navigate to="/login" />;
		} else {
			return <Error gqlError={error} />;
		}
	}

	return (
		<div className="background">
			<div className="white_block">
				<div className="new_user_content">
					<div className="new_user_header">
						<h1>Welcome to PONG</h1>
						please fill create a username and select a profile picture
					</div>
					<NewUserForm user={data.currentUserQuery} />
				</div>
			</div>
		</div>
	);
}
export default NewUser;
