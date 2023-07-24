import { ApolloError } from "@apollo/client";

function httpStatusCode(error: ApolloError): number {
	return error.graphQLErrors.at(0).extensions.originalError.statusCode;
}
export default httpStatusCode;
