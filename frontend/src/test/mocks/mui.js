import React from "react";

const Container = ({ children, ...props }) =>
  React.createElement("div", props, children);
const Paper = ({ children, ...props }) =>
  React.createElement("div", props, children);
const TextField = ({ label, ...props }) =>
  React.createElement("input", { "aria-label": label, ...props });
const Button = ({ children, ...props }) =>
  React.createElement("button", props, children);
const Typography = ({ children, ...props }) =>
  React.createElement("h1", props, children);
const Box = ({ children, ...props }) =>
  React.createElement("div", props, children);
const Alert = ({ children, ...props }) =>
  React.createElement("div", props, children);

export { Container, Paper, TextField, Button, Typography, Box, Alert };
