# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e7]: D
    - heading "Welcome back" [level=1] [ref=e8]
    - paragraph [ref=e9]: Sign in to your DigiStoq account
  - generic [ref=e11]:
    - button "Sign in with Google" [ref=e12] [cursor=pointer]:
      - img [ref=e13]
      - text: Sign in with Google
    - generic [ref=e22]: Or continue with
    - generic [ref=e23]:
      - generic [ref=e24] [cursor=pointer]: Email address*
      - generic [ref=e25]:
        - generic:
          - img
        - textbox "Email address*" [ref=e26]:
          - /placeholder: you@example.com
    - generic [ref=e27]:
      - generic [ref=e28] [cursor=pointer]: Password*
      - generic [ref=e29]:
        - generic:
          - img
        - textbox "Password*" [ref=e30]:
          - /placeholder: Enter your password
        - button "Show password" [ref=e32] [cursor=pointer]:
          - img [ref=e33]
    - link "Forgot password?" [ref=e37] [cursor=pointer]:
      - /url: /forgot-password
    - button "Sign in" [ref=e38] [cursor=pointer]
    - paragraph [ref=e39]:
      - text: Don't have an account?
      - link "Create one" [ref=e40] [cursor=pointer]:
        - /url: /signup
  - paragraph [ref=e41]: DigiStoq - Inventory Management
```