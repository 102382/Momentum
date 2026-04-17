import { useEffect, useState } from "react";
import "./opdrachtenForm.css";
const OpdrachtUpdateForm = () => {
    return (
        <form>
        <div className="formGroup">
          <label htmlFor="titel">
            <i className="fa-solid fa-heading"></i> Titel
          </label>
          <input
            type="text"
            id="titel"
            name="titel"
            value={"".titel}
            onChange={handleChange}
            placeholder="Bijv. Dagelijkse workout"
            maxLength="50"
          />
          <small>{"".titel.length}/50</small>
        </div>

        <div className="formGroup">
          <label htmlFor="beschrijving">
            <i className="fa-solid fa-align-left"></i> Beschrijving
          </label>
          <textarea
            id="beschrijving"
            name="beschrijving"
            value={"".beschrijving}
            onChange={handleChange}
            placeholder="Wat moet je doen?"
            maxLength="200"
            rows="4"
          ></textarea>
          <small>{"".beschrijving.length}/200</small>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="kategorie">
              <i className="fa-solid fa-tag"></i> Categorie
            </label>
            <select
              id="kategorie"
              name="categorie"
              value={"".categorie}
              onChange={handleChange}
            >
              <option value="gezondheid">Gezondheid</option>
              <option value="welzijn">Welzijn</option>
              <option value="voeding">Voeding</option>
              <option value="sociaal">Sociaal</option>
              <option value="leren">Leren</option>
              <option value="hobby">Hobby</option>
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="prioriteit">
              <i className="fa-solid fa-arrow-up"></i> Prioriteit
            </label>
            <select
              id="prioriteit"
              name="prioriteit"
              value={"".prioriteit}
              onChange={handleChange}
            >
              <option value="laag">Laag</option>
              <option value="middel">Middel</option>
              <option value="hoog">Hoog</option>
            </select>
          </div>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="deadline">
              <i className="fa-solid fa-calendar"></i> Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={"".deadline}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="status">
              <i className="fa-solid fa-check"></i> Status
            </label>
            <select
              id="status"
              name="status"
              value={"".status}
              onChange={handleChange}
            >
              <option value="pending">In wachtrij</option>
              <option value="in-progress">Bezig</option>
              <option value="completed">Voltooid</option>
            </select>
          </div>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="progress">
              <i className="fa-solid fa-chart-simple"></i> Voortgang
            </label>
            <div className="sliderContainer">
              <input
                type="range"
                id="progress"
                name="progress"
                min="0"
                max="100"
                value={"".progress}
                onChange={handleChange}
              />
              <span className="sliderValue">{"".progress}%</span>
            </div>
          </div>
        </div>

        <div className="formActions">
          <button type="button" className="btnCancel" onClick={onCancel}>
            Annuleren
          </button>
          <button type="submit" className="btnSubmit" disabled={loadingSubmit}>
            {loadingSubmit ? "Bezig..." : "Opdracht maken"}
          </button>
        </div>
      </form>
    );
}

export default OpdrachtUpdateForm;