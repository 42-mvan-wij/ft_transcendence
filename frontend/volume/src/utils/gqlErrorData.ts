import { ApolloError } from "@apollo/client";

export function gqlErrorCode(error: ApolloError): any {
	if (error.networkError) return error.networkError.name;
	return error.graphQLErrors.at(0)?.extensions.code;
}

export function gqlErrorMsg(error: ApolloError): any {
	if (error.networkError) return error.networkError.message;
	return error.graphQLErrors.at(0)?.message;
}

export function gqlOriginalError(error: ApolloError): any {
	if (error.networkError) return null;
	return error.graphQLErrors.at(0)?.extensions.originalError;
}
