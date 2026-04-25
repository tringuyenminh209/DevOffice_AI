package repository

import "errors"

var (
	ErrNotFound            = errors.New("not_found")
	ErrInsufficientCredits = errors.New("insufficient_credits")
	ErrForbidden           = errors.New("forbidden")
	ErrConflict            = errors.New("conflict")
)
