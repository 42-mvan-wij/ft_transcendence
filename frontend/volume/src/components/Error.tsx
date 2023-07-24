import { ApolloError } from "@apollo/client";

function Error({ gqlError }: { gqlError: ApolloError }): JSX.Element {
	console.log(gqlError.networkError);
	return (
		<div className="div-1">
			<div className="play-button">
				<h1>{0}</h1>
				<br />
				Unauthorized
			</div>
		</div>
	);
}
export default Error;
