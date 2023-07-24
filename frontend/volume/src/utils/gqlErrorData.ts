import { ApolloError } from "@apollo/client";

export function gqlErrorCode(error: ApolloError): string {
	if (error.graphQLErrors) return null;
	return error.graphQLErrors.at(0).extensions.code;
}

export function gqlErrorMsg(error: ApolloError): string {
	return error.graphQLErrors.at(0).message;
}

export function gqlOriginalError(error: ApolloError) {
	return error.graphQLErrors.at(0).extensions.originalError;
}
