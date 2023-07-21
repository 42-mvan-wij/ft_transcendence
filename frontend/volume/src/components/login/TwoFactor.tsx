import { useMutation } from "@apollo/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "src/styles/style.css";
import { LOGIN_WITH_TWO_FA } from "src/utils/graphQLMutations";

function TwoFactor(): JSX.Element {
	const navigate = useNavigate();
	const [twoFACodeMutation, { loading, error, data }] = useMutation(LOGIN_WITH_TWO_FA, {
		onCompleted(data) {
			if (data.loginWithTwoFA == true) navigate("/home");
		},
	});

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		twoFACodeMutation({
			variables: {
				twoFaCode: event.currentTarget.twoFactorCode.value,
			},
		});
	};

	return (
		<div className="background">
			<div className="white_block">
				<form className="login_form" method="post" onSubmit={handleSubmit}>
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
