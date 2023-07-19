import { useMutation, useQuery } from "@apollo/client";
import { useState, useEffect } from "react";
import "src/styles/style.css";
import Loading from "../authorization/Loading";
import { TWO_FA_MUTATION } from "src/utils/graphQLMutations";
import { CURRENT_USER, QR_CODE_QUERY } from "src/utils/graphQLQueries";
import ProfileForm from "./ProfileForm";

export default function SettingsModule({ user, showModal }): JSX.Element {
	const [TwoFAFormMutation, TwoFAMutationState] = useMutation(TWO_FA_MUTATION, {
		refetchQueries: [{ query: CURRENT_USER }, { query: QR_CODE_QUERY }],
	});
	const QRCodeState = useQuery(QR_CODE_QUERY);
	const [checked, setChecked] = useState(user.twoFAEnabled);

	const handleCheckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setChecked(event.target.checked);
	};

	useEffect(() => {
		TwoFAFormMutation({
			variables: {
				twoFaState: checked,
			},
		});
	}, [checked]);

	if (QRCodeState.loading) return <Loading />;
	if (QRCodeState.error) {
		return <>Error</>;
	}

	return (
		<div className="modal_user_profile_settings">
			<div className="wrapper">
				<ProfileForm user={user} />
				<form className="profile_form" method="post">
					<h3>Enable 2FA</h3>
					<label className="switch">
						<input type="checkbox" onChange={handleCheckChange} checked={checked} />
						<span className="slider round"></span>
					</label>
					<div className="qr_code_container">
						<img src={QRCodeState.data.QRCodeQuery} alt="error no code" />
					</div>
				</form>
			</div>
		</div>
	);
}
