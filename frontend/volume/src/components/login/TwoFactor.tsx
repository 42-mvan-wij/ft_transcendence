import { gql, useQuery } from "@apollo/client";
import "src/styles/style.css";

const USER_QUERY = gql`
	query currentUserQuery {
		currentUserQuery {
			id
			username
			avatar {
				file
				filename
			}
		}
	}
`;

function TwoFactor(): JSX.Element {
	const { loading, error, data } = useQuery(USER_QUERY);
	// const input
	if (error) {
		console.log(error);
		return <>error</>;
	}
	if (loading) return <>loading</>;

	return (
		<div className="background">
			<div className="white_block">
				<form className="login_form" method="post">
					<h3>Fill in your code</h3>
					<input type="text" name="twoFactorCode" />
					<button className="submit_button" type="submit">
						Submit Code
					</button>
				</form>
			</div>
		</div>
	);
}
export default TwoFactor;
