package envelope

type OK struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type Err struct {
	Success bool      `json:"success"`
	Error   ErrDetail `json:"error"`
}

type ErrDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func Data(v interface{}) OK {
	return OK{Success: true, Data: v}
}

func Error(code, msg string) Err {
	return Err{Success: false, Error: ErrDetail{Code: code, Message: msg}}
}

type Page struct {
	Items      interface{} `json:"items"`
	NextCursor *string     `json:"nextCursor,omitempty"`
}
