export const type = { // describe previleges
  NORMAL: 0,
  ADMIN: 1,
  EDITOR: 2
};

export const creation = {
  REGISTERED: 0,
  CREATED: 1
};

export const resource = {
  TODO: 0,
  ARTICLE: 1
};

export const reserved = ['activateaccount', 'resetpassword', 'admin', 'root'];

export const defaultResources = [resource.TODO, resource.ARTICLE];
