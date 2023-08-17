import { ApolloError } from "@apollo/client";
import { gqlErrorCode, gqlErrorMsg } from "src/utils/gqlErrorData";

function Error({ gqlError }: { gqlError: ApolloError }): JSX.Element {
	let statusCode = gqlErrorCode(gqlError);
	let errorMsg = gqlErrorMsg(gqlError);
	if (statusCode == undefined || errorMsg == undefined) {
		statusCode = "500";
		errorMsg = "Internal Server Error";
	}
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
