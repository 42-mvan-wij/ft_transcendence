import { useQuery } from "@apollo/client";
import { Navigate } from "react-router-dom";
import "src/styles/login-pages/new-user.css";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import Loading from "../authorization/Loading";
import NewUserForm from "./NewUserForm";
import Error from "../Error";
import { gqlErrorCode } from "src/utils/gqlErrorData";

function NewUser(): JSX.Element {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
						<h2>Create your profile and get started</h2>
					</div>
					<NewUserForm />
				</div>
			</div>
		</div>
	);
}
export default NewUser;
