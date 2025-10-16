import {Router} from "express"
import sessionController from "../../modules/session/session.controller.js"

const sessionRouter = Router()

sessionRouter.get("/test", sessionController.test)
sessionRouter.get("/all-sessions", sessionController.get_sessions)

sessionRouter.post("/new-session", sessionController.new_session)
sessionRouter.post("/load-session/:sessionId", sessionController.load_session)

sessionRouter.delete("/delete/:sessionId", sessionController.end_session)

export default sessionRouter;