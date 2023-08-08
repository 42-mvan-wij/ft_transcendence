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

export const SET_TWO_FA_MUTATION = gql`
	mutation setTwoFAMutation($twoFaState: Boolean!) {
		setTwoFactorMutation(TwoFAState: $twoFaState)
	}
`;

export const LOGIN_WITH_TWO_FA = gql`
	mutation Mutation($twoFaCode: String!) {
		loginWithTwoFA(twoFACode: $twoFaCode)
	}
`;

export const CHALLENGE_FRIEND = gql`
	mutation ChallengeFriend($friendId: String!) {
		challengeFriend(friendId: $friendId)
	}
`;
