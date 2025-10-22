import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Alert, Row, Col, Card, Container, ProgressBar, Spinner } from "react-bootstrap";
import InputMask from "react-input-mask";

// ---------- Config: use env so dev and prod switch automatically ----------
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5134";
const REGISTER_URL = `${API_BASE}/auth/register`;

// ---------- Simple validators ----------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MASK_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;
const ZIP_REGEX = /^\d{5}$/;

// Helpers
const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const unmaskPhone = (v) => (v || "").replace(/[^\d]/g, ""); // "(860) 555-1212" -> "8605551212"

const Register = () => {
  const userRef = useRef(null);
  const errRef = useRef(null);

  // Steps
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Loading & status
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Form fields
  const [playerFirstName, setPlayerFirstName] = useState("");
  const [playerLastName, setPlayerLastName] = useState("");
  const [parentName, setParentName] = useState("");

  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);

  const [gradeLevel, setGradeLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [validPhone, setValidPhone] = useState(false);
  const [gender, setGender] = useState("");

  const [street, setStreet] = useState("");
  const [town, setTown] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [validZip, setValidZip] = useState(false);

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [validEmergencyPhone, setValidEmergencyPhone] = useState(false);

  // Focus first input
  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // Live validations
  useEffect(() => setValidEmail(EMAIL_REGEX.test(email)), [email]);
  useEffect(() => setValidPhone(PHONE_MASK_REGEX.test(phone)), [phone]);
  useEffect(() => setValidZip(ZIP_REGEX.test(zip)), [zip]);
  useEffect(() => setValidEmergencyPhone(PHONE_MASK_REGEX.test(emergencyContactNumber)), [emergencyContactNumber]);

  // Step gating
  const canGoStep1Next =
    isNonEmpty(playerFirstName) &&
    isNonEmpty(playerLastName) &&
    isNonEmpty(gradeLevel) &&
    isNonEmpty(gender);

  const canGoStep2Next =
    isNonEmpty(parentName) &&
    validEmail &&
    validPhone;

  const canSubmit =
    isNonEmpty(street) &&
    isNonEmpty(town) &&
    isNonEmpty(state) &&
    validZip &&
    isNonEmpty(emergencyContactName) &&
    validEmergencyPhone;

  const nextStep = () => {
    setErrMsg("");
    setStep((s) => Math.min(totalSteps, s + 1));
  };
  const prevStep = () => {
    setErrMsg("");
    setStep((s) => Math.max(1, s - 1));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    // Re-validate before submit
    if (!canSubmit || !canGoStep2Next || !canGoStep1Next) {
      setErrMsg("Please complete all required fields correctly before submitting.");
      errRef.current?.focus();
      return;
    }

    // Prepare payload (trim email, unmask phones)
    const payload = {
      playerFirstName: playerFirstName.trim(),
      playerLastName: playerLastName.trim(),
      parentName: parentName.trim(),
      email: email.trim().toLowerCase(),
      gradeLevel,
      phone, // masked string; backend can normalize; or send unmaskPhone(phone) if you prefer
      gender,
      street: street.trim(),
      town: town.trim(),
      state,
      zip,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactNumber, // masked; backend can normalize too
    };

    setSubmitting(true);
    try {
      const response = await axios.post(REGISTER_URL, payload, {
        headers: { "Content-Type": "application/json" },
        // withCredentials: false // not using cookies/sessions; omit entirely
      });

      // Success
      console.log(response?.data);
      setSuccess(true);
    } catch (err) {
      // Network error
      if (!err?.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 409) {
        // Duplicate from backend (unique violation)
        setErrMsg(err.response?.data?.message || "Already registered with this email/player.");
      } else if (err.response?.status === 400) {
        setErrMsg(err.response?.data?.message || "Invalid input");
      } else {
        setErrMsg(err.response?.data?.message || "Registration Failed");
      }
      errRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!success ? (
        <Container className="mt-5">
          <Card style={{ maxWidth: "50rem", margin: "0 auto" }}>
            <Card.Header as="h2" className="text-center">
              Tryout Registration
            </Card.Header>
            <Card.Body>
              {errMsg && (
                <Alert ref={errRef} variant="danger" aria-live="assertive">
                  {errMsg}
                </Alert>
              )}

              <ProgressBar
                now={(step / totalSteps) * 100}
                className="mb-4"
                label={`Step ${step} of ${totalSteps}`}
              />

              <Form onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    {/* Player Information */}
                    <h3>Player Information</h3>
                    <Row className="mb-3">
                      <Form.Group as={Col} controlId="formGridPlayerFirstName">
                        <Form.Label>Player's First Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="First Name"
                          ref={userRef}
                          onChange={(e) => setPlayerFirstName(e.target.value)}
                          value={playerFirstName}
                          required
                        />
                      </Form.Group>
                      <Form.Group as={Col} controlId="formGridPlayerLastName">
                        <Form.Label>Player's Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Last Name"
                          onChange={(e) => setPlayerLastName(e.target.value)}
                          value={playerLastName}
                          required
                        />
                      </Form.Group>
                    </Row>

                    <Form.Group className="mb-3" controlId="formGridGradeLevel">
                      <Form.Label>Grade Level</Form.Label>
                      <Form.Select
                        onChange={(e) => setGradeLevel(e.target.value)}
                        value={gradeLevel}
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="4th Grade">4th Grade</option>
                        <option value="5th Grade">5th Grade</option>
                        <option value="6th Grade">6th Grade</option>
                        <option value="7th Grade">7th Grade</option>
                        <option value="8th Grade">8th Grade</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formGridGender">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        onChange={(e) => setGender(e.target.value)}
                        value={gender}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </Form.Select>
                    </Form.Group>

                    <Button
                      variant="primary"
                      onClick={nextStep}
                      disabled={!canGoStep1Next}
                    >
                      Next
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Parent/Guardian Information */}
                    <h3>Parent/Guardian Information</h3>
                    <Form.Group className="mb-3" controlId="formGridParentName">
                      <Form.Label>Parent/Guardian Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Parent/Guardian Name"
                        onChange={(e) => setParentName(e.target.value)}
                        value={parentName}
                        required
                      />
                    </Form.Group>

                    <Row className="mb-3">
                      <Form.Group as={Col} controlId="formGridEmail">
                        <Form.Label>Email (Parent/Guardian)</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter email"
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                          isInvalid={email !== "" && !validEmail}
                          isValid={validEmail}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Invalid Email Address.
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group as={Col} controlId="formGridPhone">
                        <Form.Label>Phone Number (Parent/Guardian)</Form.Label>
                        <InputMask
                          mask="(999) 999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`form-control ${phone && !validPhone ? "is-invalid" : ""}`}
                          required
                        />
                        {!validPhone && phone && (
                          <div className="invalid-feedback d-block">Invalid Phone Number.</div>
                        )}
                      </Form.Group>
                    </Row>

                    <Button variant="secondary" onClick={prevStep} className="me-2">
                      Previous
                    </Button>
                    <Button
                      variant="primary"
                      onClick={nextStep}
                      disabled={!canGoStep2Next}
                    >
                      Next
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <>
                    {/* Address and Emergency Contact */}
                    <h3>Address</h3>
                    <Form.Group className="mb-3" controlId="formGridAddress1">
                      <Form.Label>Street</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Street"
                        onChange={(e) => setStreet(e.target.value)}
                        value={street}
                        required
                      />
                    </Form.Group>

                    <Row className="mb-3">
                      <Form.Group as={Col} controlId="formGridTown">
                        <Form.Label>Town</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Town"
                          onChange={(e) => setTown(e.target.value)}
                          value={town}
                          required
                        />
                      </Form.Group>

                      <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>State</Form.Label>
                        <Form.Select
                          onChange={(e) => setState(e.target.value)}
                          value={state}
                          required
                        >
                          <option value="">Select State</option>
                          <option value="CT">Connecticut</option>
                          {/* add more states as needed */}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group as={Col} controlId="formGridZip">
                        <Form.Label>Zip Code</Form.Label>
                        <InputMask
                          mask="99999"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className={`form-control ${zip && !validZip ? "is-invalid" : ""}`}
                          required
                        />
                        {!validZip && zip && (
                          <div className="invalid-feedback d-block">Invalid Zip Code.</div>
                        )}
                      </Form.Group>
                    </Row>

                    <h3>Emergency Contact</h3>
                    <Form.Group className="mb-3" controlId="formGridEmergencyContactName">
                      <Form.Label>Emergency Contact Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Emergency Contact Name"
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        value={emergencyContactName}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formGridEmergencyContactNumber">
                      <Form.Label>Emergency Contact Number</Form.Label>
                      <InputMask
                        mask="(999) 999-9999"
                        value={emergencyContactNumber}
                        onChange={(e) => setEmergencyContactNumber(e.target.value)}
                        className={`form-control ${emergencyContactNumber && !validEmergencyPhone ? "is-invalid" : ""}`}
                        required
                      />
                      {!validEmergencyPhone && emergencyContactNumber && (
                        <div className="invalid-feedback d-block">Invalid Emergency Contact Number.</div>
                      )}
                    </Form.Group>

                    <Button variant="secondary" onClick={prevStep} className="me-2">
                      Previous
                    </Button>
                    <Button variant="success" type="submit" disabled={!canSubmit || submitting}>
                      {submitting ? (<><Spinner size="sm" className="me-2" /> Submitting…</>) : "Submit Registration"}
                    </Button>
                  </>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Container>
      ) : (
        // Confirmation Page
        <Container className="mt-5">
          <Card style={{ maxWidth: "50rem", margin: "0 auto" }}>
            <Card.Body className="text-center">
              <h1>Registration Successful!</h1>
              <p>
                Thank you, {parentName}, for registering {playerFirstName} {playerLastName}.
              </p>
              <h3>Next Steps:</h3>
              <ul className="list-unstyled">
                <li><strong>Tryout Date:</strong> Tentatively, the week of October 27th</li>
                <li><strong>Location:</strong>Rockville High School</li>
                <li>
                  <strong>What to Bring:</strong>Parents/Guardians please attend with your child to fill out a Waiver!! Please wear sports wear. More details will be out over the next coming days.
                </li>
              </ul>
              <p>
                Questions? Use our contact page or email us at <strong>vernonyouthbasketball@gmail.com</strong>.
              </p>
              <Button variant="primary" href="/">Return to Home</Button>
            </Card.Body>
          </Card>
        </Container>
      )}
    </>
  );
};

export default Register;
