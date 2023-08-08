import { ApolloError } from "@apollo/client";
import { gqlErrorCode, gqlErrorMsg } from "src/utils/gqlErrorData";

function Error({ gqlError }: { gqlError: ApolloError }): JSX.Element {
	const statusCode = gqlErrorCode(gqlError);
	const errorMsg = gqlErrorMsg(gqlError);
	return (
		<div className="div-1">
			<div className="play-button">
				<h1>{statusCode}</h1>
				<br />
				{errorMsg}
			</div>
		</div>
	);
}
export default Error;
