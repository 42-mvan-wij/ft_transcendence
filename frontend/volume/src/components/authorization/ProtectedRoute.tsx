import { gql, useQuery } from "@apollo/client";
import { Navigate } from "react-router-dom";
import httpStatusCode from "src/utils/httpStatusCode";
import Loading from "./Loading";

const CURRENT_USER = gql`
	query currentUserQuery {
		currentUserQuery {
			username
			avatar {
				file
			}
			id
		}
	}
`;

function ProtectedRoute({ children }: { children: any }): JSX.Element {
	const { loading, error, data } = useQuery(CURRENT_USER);

	if (loading) return <Loading />;
	if (error) {
		if (httpStatusCode(error) == 401) {
			console.log(httpStatusCode(error));
			return <Navigate to="/login" replace />;
		}
	}
	return children;
}
export default ProtectedRoute;
