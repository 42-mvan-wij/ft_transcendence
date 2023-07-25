import { useQuery } from "@apollo/client";
import { Navigate } from "react-router-dom";
import { gqlErrorCode, gqlOriginalError } from "src/utils/gqlErrorData";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import Error from "../Error";
import Loading from "./Loading";

function ProtectedRoute({ children }: { children: any }): JSX.Element {
	const { loading, error, data } = useQuery(CURRENT_USER);

	if (loading) return <Loading />;
	if (error) {
		if (gqlErrorCode(error) == "UNAUTHENTICATED") {
			return <Navigate to="/login" />;
		} else {
			return <Error gqlError={error} />;
		}
	}
	return children;
}
export default ProtectedRoute;
