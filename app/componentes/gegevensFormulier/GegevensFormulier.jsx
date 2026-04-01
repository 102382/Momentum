import "../gegevensFormulier/gegevensFormulier.css";

const GegevensFormulier = () => {
  return (
    <div className="formulierContainer">
      <div className="gegevens-formulier">
        <h2>Vertel ons meer over jezelf</h2>

        <form action="">
          <div className="NaamEnLeeftijd">
            <div className="Naam">
              <label htmlFor="Naam">Hoe heet je?</label>
              <br />
              <input type="text" id="Naam" placeholder="Naam" />
            </div>

            <div className="Leeftijd">
              <label htmlFor="Leeftijd">Hoe oud ben je?</label>
              <br />
              <input type="number" id="Leeftijd" placeholder="Leeftijd" />
            </div>

            <div className="Geslacht">
              <label htmlFor="Geslacht">Wat is je geslacht?</label>
              <br />
              <select id="Geslacht" name="Geslacht">
                <option value="">Kies je geslacht</option>
                <option value="man">Man</option>
                <option value="vrouw">Vrouw</option>
              </select>
            </div>
          </div>
          <div className="hobbies">
            <label htmlFor="hobbies">Wat zijn je hobby's?</label>
            <br />
            <input type="text" id="hobbies" placeholder="Hobbies" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default GegevensFormulier;
