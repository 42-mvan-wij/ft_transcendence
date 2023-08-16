import { useMutation } from "@apollo/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "src/styles/style.css";
import { LOGIN_WITH_TWO_FA } from "src/utils/graphQLMutations";

function TwoFactor(): JSX.Element {
	const [invalidCode, setInvalidCode] = useState(false);
	const navigate = useNavigate();
	const [twoFACodeMutation] = useMutation(LOGIN_WITH_TWO_FA, {
		onCompleted(data) {
			if (data.loginWithTwoFA == true) navigate("/home");
			else setInvalidCode(true);
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
					<input type="text" name="twoFactorCode" minLength={1} maxLength={20} />
					{invalidCode && <p className="invalid_code_popup">Code is invalid</p>}
					<button className="submit_button" type="submit">
						Submit Code
					</button>
				</form>
			</div>
		</div>
	);
}
export default TwoFactor;
