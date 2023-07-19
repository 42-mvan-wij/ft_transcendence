import { gql } from "@apollo/client";

export const FORM_MUTATION = gql`
	mutation changeUserData($input: ChangeUserDataInput!) {
		changeUserData(changeUserData: $input) {
			username
			avatar {
				file
				filename
			}
		}
	}
`;

export const TWO_FA_MUTATION = gql`
	mutation TwoFAMutation($twoFaState: Boolean!) {
		setTwoFactorMutation(TwoFAState: $twoFaState)
	}
`;
