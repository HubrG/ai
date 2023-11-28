
export const isAuthorized = (tokenRequired: any, user: any, type: string) => {
    const token = tokenRequired?.find(
        (token: any) => token.featureName === type
        );
        if (!token) {
            return;
        }
        const userToken = user?.tokenRemaining;
        if (!userToken) {
            return;
        }
       
        if (userToken < token.minRequired) {
      return false;
  }
    return true;
};
