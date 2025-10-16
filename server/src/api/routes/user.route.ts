import {Router} from "express"
import userController from "../../modules/user/user.controller";

const userRouter = Router();

userRouter.get("/getById/:playerId", userController.getById)

userRouter.put("/editPlayer/:playerId", userController.editPlayer)

userRouter.delete("/removePlayer/:playerId", userController.removePlayer)

export default userRouter;